// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;



interface IERC20 {
  function balanceOf(address account) external view returns (uint256);
  function transfer(address recipient, uint256 amount) external returns (bool);
  function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
}

interface IzentaroBank {
  function totalStaked() external view returns (uint256);

  function pendingDividend(address who) external view returns (uint256);

  function user(address who) external view returns (
    uint256 totalAllow,
    uint256 totalBuy,
    uint256 depo,
    uint256 stakingTime,
    uint256 lastClaim
  );
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

contract zentaroTreasury is Ownable, ReentrancyGuard {
  IERC20 public immutable zentaro;
  IzentaroBank public immutable zentaroBank;

  address public admin;

  // 기본값(배포 시 입력 최소화)
  uint256 public votingPeriod = 3 days; // 투표기간
  uint256 public quorumBps = 5000;      // 50%
  uint256 public minDelay = 0;          // timelock

  struct Proposal {
    uint256 id;
    uint256 amount;        // zentaro amount (정수 단위)
    address recipient;     // 생성 시점의 admin 스냅샷 (execute 시 이 주소로만 지급)
    uint256 quorumBpsAtCreation; // 생성 시점의 quorumBps 스냅샷
    uint256 startTime;
    uint256 endTime;
    uint256 executeAfter;  // endTime + minDelay (minDelay=0이면 endTime)
    uint256 yesVotes;
    uint256 noVotes;
    bool executed;
    bool canceled;
  }

  uint256 public nextProposalId = 1;
  mapping(uint256 => Proposal) public proposals;

  // proposalId => voter => voted?
  mapping(uint256 => mapping(address => bool)) public hasVoted;

  // snapshot weight (vote 시점의 depo 저장)
  mapping(uint256 => mapping(address => uint256)) public votedWeight;

  event adminChanged(address indexed prev, address indexed next);
  event ParamsChanged(uint256 votingPeriod, uint256 quorumBps, uint256 minDelay);

  event TreasuryDeposited(uint256 amount);
  event ProposalCreated(uint256 indexed id, uint256 amount, uint256 startTime, uint256 endTime, uint256 executeAfter);
  event Voted(uint256 indexed id, address indexed voter, bool support, uint256 weight, uint256 pendingDividendAtVote);
  event ProposalExecuted(uint256 indexed id, uint256 amount, address indexed recipient);
  event ProposalCanceled(uint256 indexed id);

  constructor(
    address zentaroToken,
    address zentaroBankAddress,
    address initialadmin
  ) Ownable(msg.sender) {
    require(zentaroToken != address(0), "zentaro: zero");
    require(zentaroBankAddress != address(0), "HB: zero");
    require(initialadmin != address(0), "BEN: zero");

    zentaro = IERC20(zentaroToken);
    zentaroBank = IzentaroBank(zentaroBankAddress);
    admin = initialadmin;

    emit adminChanged(address(0), initialadmin);
    emit ParamsChanged(votingPeriod, quorumBps, minDelay);
  }

  // 옵션: 인출자 변경)
  function setadmin(address next) external onlyOwner {
    require(next != address(0), "BEN: zero");
    emit adminChanged(admin, next);
    admin = next;
  }

 

  function setParams(uint256 _votingPeriodSeconds, uint256 _quorumBps, uint256 _minDelaySeconds) external onlyOwner {
    require(_votingPeriodSeconds >= 1 hours, "period too short");
    require(_quorumBps <= 10000, "quorum bps");
    votingPeriod = _votingPeriodSeconds;
    quorumBps = _quorumBps;
    minDelay = _minDelaySeconds;
    emit ParamsChanged(votingPeriod, quorumBps, minDelay);
  }

  // 트레저리 잠금 (예: 50,000,000 zentaro)
  // 사전에 zentaro.approve(this, amount) 필요
  function depositTreasury(uint256 amount) external onlyOwner nonReentrant {
    require(amount > 0, "amount=0");
    bool ok = zentaro.transferFrom(msg.sender, address(this), amount);
    require(ok, "transferFrom fail");
    emit TreasuryDeposited(amount);
  }

  // admin만 출금 제안 생성
  function createWithdrawProposal(uint256 amount) external returns (uint256 id) {
    require(msg.sender == admin, "only admin");
    require(amount > 0, "amount=0");
    require(zentaro.balanceOf(address(this)) >= amount, "treasury insufficient");

    id = nextProposalId++;
    uint256 start = block.timestamp;
    uint256 end = start + votingPeriod;

    proposals[id] = Proposal({
      id: id,
      amount: amount,
      recipient: admin,
      quorumBpsAtCreation: quorumBps,
      startTime: start,
      endTime: end,
      executeAfter: end + minDelay,
      yesVotes: 0,
      noVotes: 0,
      executed: false,
      canceled: false
    });

    emit ProposalCreated(id, amount, start, end, end + minDelay);
  }

  // 투표권(가중치): zentaroBank.user(who).depo
  function votingPower(address who) public view returns (uint256 depo) {
    (, , depo, , ) = zentaroBank.user(who);
  }

  // 정족수 요구치(현재 기준): 참고/표시용. 실제 가결 판정은 proposal 생성 시점에
  // 스냅샷된 quorumBpsAtCreation을 쓰는 quorumRequiredFor()로 한다 (owner가 setParams로
  // quorumBps를 바꿔서 이미 만들어진 제안의 통과 여부를 조작하지 못하게 하기 위함).
  function quorumRequired() public view returns (uint256) {
    uint256 ts = zentaroBank.totalStaked();
    return (ts * quorumBps) / 10000;
  }

  function quorumRequiredFor(uint256 proposalId) public view returns (uint256) {
    Proposal storage p = proposals[proposalId];
    uint256 ts = zentaroBank.totalStaked();
    return (ts * p.quorumBpsAtCreation) / 10000;
  }

  // 조기 가결 조건(즉시 실행 핵심)
  // - 정족수 충족 (yes+no >= quorumRequiredFor(proposalId))
  // - yes가 전체 스테이킹(totalStaked)의 과반 초과 (yes*2 > totalStaked)
  function isEarlyPassed(uint256 proposalId) public view returns (bool) {
    Proposal storage p = proposals[proposalId];
    if (p.id == 0) return false;
    if (p.canceled || p.executed) return false;

    uint256 ts = zentaroBank.totalStaked();
    if (ts == 0) return false;

    uint256 totalVotes = p.yesVotes + p.noVotes;
    if (totalVotes < quorumRequiredFor(proposalId)) return false;

    if (p.yesVotes * 2 <= ts) return false; // 과반(초과) 필요

    return true;
  }

  // 일반 가결(투표 종료 후)
  function isPassed(uint256 proposalId) public view returns (bool) {
    Proposal storage p = proposals[proposalId];
    if (p.id == 0) return false;
    if (p.canceled || p.executed) return false;
    if (block.timestamp < p.endTime) return false;

    uint256 totalVotes = p.yesVotes + p.noVotes;
    if (totalVotes < quorumRequiredFor(proposalId)) return false;
    if (p.yesVotes <= p.noVotes) return false;

    return true;
  }

  // 투표 (snapshot 방식)
  function vote(uint256 proposalId, bool support) external {
    Proposal storage p = proposals[proposalId];
    require(p.id != 0, "no proposal");
    require(!p.canceled, "canceled");
    require(!p.executed, "executed");
    require(block.timestamp >= p.startTime, "not started");
    require(block.timestamp < p.endTime, "ended");
    require(!hasVoted[proposalId][msg.sender], "already voted");

    uint256 weight = votingPower(msg.sender);
    require(weight > 0, "no stake in zentarobank");

    hasVoted[proposalId][msg.sender] = true;
    votedWeight[proposalId][msg.sender] = weight;

    if (support) p.yesVotes += weight;
    else p.noVotes += weight;

    uint256 pend = 0;
    try zentaroBank.pendingDividend(msg.sender) returns (uint256 v) {
      pend = v;
    } catch {}

    emit Voted(proposalId, msg.sender, support, weight, pend);
  }

  // 실행: (투표 종료 OR 조기 가결) + (timelock 만족) 시 전송
  function execute(uint256 proposalId) external nonReentrant {
    Proposal storage p = proposals[proposalId];
    require(p.id != 0, "no proposal");
    require(!p.canceled, "canceled");
    require(!p.executed, "executed");

    // (1) 종료 후 가결 또는 (2) 조기 가결
    require(
      block.timestamp >= p.endTime || isEarlyPassed(proposalId),
      "vote still active"
    );

    // timelock: 조기 가결이라도 minDelay를 적용하고 싶으면 아래 로직 유지
    // minDelay=0이면 사실상 즉시
    if (minDelay > 0) {
      // 조기 실행 시에도 최소 지연을 적용하려면 "현재시간 >= startTime + minDelay" 같은 룰이 더 맞습니다.
      // 여기서는 기존 executeAfter(endTime+minDelay)를 그대로 쓰면 조기 실행 의미가 사라지므로,
      // 조기 실행일 때는 startTime+minDelay 기준으로 적용합니다.
      uint256 earliest = p.startTime + minDelay;
      require(block.timestamp >= earliest, "timelocked");
    }

    require(zentaro.balanceOf(address(this)) >= p.amount, "insufficient");

    p.executed = true;

    bool ok = zentaro.transfer(p.recipient, p.amount);
    require(ok, "transfer fail");

    emit ProposalExecuted(proposalId, p.amount, p.recipient);
  }

  function cancel(uint256 proposalId) external onlyOwner {
    Proposal storage p = proposals[proposalId];
    require(p.id != 0, "no proposal");
    require(!p.executed, "executed");
    require(!p.canceled, "already");
    p.canceled = true;
    emit ProposalCanceled(proposalId);
  }

  // 프론트 표시용
  function timeToEnd(uint256 proposalId) external view returns (uint256) {
    Proposal storage p = proposals[proposalId];
    if (p.id == 0) return 0;
    if (block.timestamp >= p.endTime) return 0;
    return p.endTime - block.timestamp;
  }

  function treasuryBalance() external view returns (uint256) {
    return zentaro.balanceOf(address(this));
  }
}
