// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
}

contract Ownable {
    address public owner;
    event OwnershipTransferred(address indexed prev, address indexed next);

    modifier onlyOwner() {
        require(msg.sender == owner, "OWN: not owner");
        _;
    }

    constructor(address initialOwner) {
        require(initialOwner != address(0), "OWN: zero");
        owner = initialOwner;
        emit OwnershipTransferred(address(0), initialOwner);
    }

    function transferOwnership(address next) external onlyOwner {
        require(next != address(0), "OWN: zero");
        emit OwnershipTransferred(owner, next);
        owner = next;
    }
}

contract ReentrancyGuard {
    uint256 private _status = 1;
    modifier nonReentrant() {
        require(_status == 1, "REENTRANCY");
        _status = 2;
        _;
        _status = 1;
    }
}


contract ZtroRewardDispenser is Ownable, ReentrancyGuard {
    // ZTRO: decimals = 0 (whole-token units). Deployed at
    // 0x4c88B8b5caC7F6c3F28612fe4DcCA94e76541cee on opBNB.
    IERC20 public immutable ztro;

    // Backend hot wallet: pays gas for reward() and is the only address allowed to call it.
    address public relayer;
    bool public paused;

    struct Tier {
        uint16 probabilityBps; // out of 10000
        uint256 minValue;
        uint256 maxValue;
    }
    Tier[] public tiers;

    // keccak256(bytes(code)) => already claimed. Defense in depth alongside the
    // backend's own Firestore single-use lock.
    mapping(bytes32 => bool) public usedRequests;

    event Rewarded(
        address indexed to,
        bytes32 indexed requestId,
        uint256 baseValue,
        uint256 randomNumber,
        uint256 amount
    );
    event RelayerChanged(address indexed prev, address indexed next);
    event TiersChanged();
    event Funded(address indexed from, uint256 amount);
    event Paused(bool paused);
    event Swept(address indexed to, uint256 amount);

    modifier onlyRelayer() {
        require(msg.sender == relayer, "not relayer");
        _;
    }

    constructor(address ztroToken, address initialRelayer) Ownable(msg.sender) {
        require(ztroToken != address(0), "ztro zero");
        require(initialRelayer != address(0), "relayer zero");
        ztro = IERC20(ztroToken);
        relayer = initialRelayer;
        emit RelayerChanged(address(0), initialRelayer);

        tiers.push(Tier(5000, 1, 100));
        tiers.push(Tier(3000, 100, 500));
        tiers.push(Tier(1000, 500, 2500));
        tiers.push(Tier(700, 2500, 5000));
        tiers.push(Tier(300, 5000, 10000));
        emit TiersChanged();
    }

    function tiersLength() external view returns (uint256) {
        return tiers.length;
    }

    /// @param to User's custodial wallet address.
    /// @param requestId keccak256(bytes(qrCode)) — one-time nonce tied to the redeemed code.
    /// @param baseValue Admin-set multiplier chosen when the QR code was issued.
    function reward(address to, bytes32 requestId, uint256 baseValue)
        external
        onlyRelayer
        nonReentrant
        returns (uint256 amount)
    {
        require(!paused, "paused");
        require(to != address(0), "to zero");
        require(baseValue > 0, "baseValue zero");
        require(!usedRequests[requestId], "already claimed");
        usedRequests[requestId] = true;

        uint256 randomNumber = _pickRandomNumber(to, requestId);
        amount = baseValue * randomNumber;

        require(ztro.balanceOf(address(this)) >= amount, "pool empty");
        require(ztro.transfer(to, amount), "transfer fail");

        emit Rewarded(to, requestId, baseValue, randomNumber, amount);
    }

    function _pickRandomNumber(address to, bytes32 requestId) internal view returns (uint256) {
        uint256 tierRoll = uint256(
            keccak256(
                abi.encodePacked(blockhash(block.number - 1), block.timestamp, to, requestId, uint8(1))
            )
        ) % 10000;

        uint256 cumulative;
        Tier memory selected = tiers[tiers.length - 1];
        for (uint256 i = 0; i < tiers.length; i++) {
            cumulative += tiers[i].probabilityBps;
            if (tierRoll < cumulative) {
                selected = tiers[i];
                break;
            }
        }

        uint256 span = selected.maxValue - selected.minValue + 1;
        uint256 valueRoll = uint256(
            keccak256(
                abi.encodePacked(blockhash(block.number - 1), block.timestamp, to, requestId, uint8(2))
            )
        ) % span;

        return selected.minValue + valueRoll;
    }

    function setRelayer(address next) external onlyOwner {
        require(next != address(0), "relayer zero");
        emit RelayerChanged(relayer, next);
        relayer = next;
    }

    /// Replaces the full tier table. `probabilityBps` values must sum to exactly 10000
    /// (100%). Each tier's draw range is [minValue, maxValue] inclusive.
    function setTiers(
        uint16[] calldata probabilityBps,
        uint256[] calldata minValues,
        uint256[] calldata maxValues
    ) external onlyOwner {
        require(probabilityBps.length > 0, "empty");
        require(
            probabilityBps.length == minValues.length && minValues.length == maxValues.length,
            "length mismatch"
        );

        uint256 sum;
        delete tiers;
        for (uint256 i = 0; i < probabilityBps.length; i++) {
            require(minValues[i] > 0 && minValues[i] <= maxValues[i], "bad range");
            sum += probabilityBps[i];
            tiers.push(Tier(probabilityBps[i], minValues[i], maxValues[i]));
        }
        require(sum == 10000, "bps must sum to 10000");
        emit TiersChanged();
    }

    function setPaused(bool p) external onlyOwner {
        paused = p;
        emit Paused(p);
    }

    /// Convenience event for indexers when admin funds the pool via a plain
    /// ztro.transfer(address(this), amount) — call this right after to log it on this
    /// contract too (purely informational, does not move funds itself).
    function notifyFunded(uint256 amount) external onlyOwner {
        emit Funded(msg.sender, amount);
    }

    function poolBalance() external view returns (uint256) {
        return ztro.balanceOf(address(this));
    }

    /// Emergency withdrawal (e.g. ending the event, migrating to a new contract).
    function sweep(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "to zero");
        require(ztro.transfer(to, amount), "transfer fail");
        emit Swept(to, amount);
    }
}

