import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface CrossPostInput {
  id: string;
  title: string;
  contentHtml: string;
  imageUrl: string | null;
}

interface BloggerTarget {
  name: string;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  blogId: string;
}

interface WordPressTarget {
  name: string;
  site: string;
  accessToken: string;
}

const POST_URL_BASE = 'https://zentaro.netlify.app/webzine';

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

@Injectable()
export class CrossPostService {
  private readonly logger = new Logger(CrossPostService.name);

  constructor(private readonly config: ConfigService) {}

  async postEverywhere(input: CrossPostInput): Promise<void> {
    const results = await Promise.allSettled([
      this.postToFacebook(input),
      ...this.bloggerTargets().map((t) => this.postToBlogger(t, input)),
      ...this.wordPressTargets().map((t) => this.postToWordPress(t, input)),
      this.postToTumblr(input),
    ]);

    for (const r of results) {
      if (r.status === 'rejected') {
        this.logger.error(`Cross-post target failed: ${r.reason}`);
      }
    }
  }

  // ---------- Facebook Page ----------

  private async postToFacebook(input: CrossPostInput): Promise<void> {
    const pageId = this.config.get<string>('FACEBOOK_PAGE_ID');
    const accessToken = this.config.get<string>('FACEBOOK_PAGE_ACCESS_TOKEN');
    if (!pageId || !accessToken) return;

    const message = `${input.title}\n\n${stripHtml(input.contentHtml).slice(0, 400)}...\n\n${POST_URL_BASE}/${input.id}`;
    const params = new URLSearchParams({
      message,
      link: `${POST_URL_BASE}/${input.id}`,
      access_token: accessToken,
    });

    const res = await fetch(`https://graph.facebook.com/v19.0/${pageId}/feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });
    const body = await res.json();
    if (!res.ok) {
      throw new Error(`Facebook post failed: ${JSON.stringify(body)}`);
    }
    this.logger.log(`Posted to Facebook Page: ${body.id ?? 'ok'}`);
  }

  // ---------- Blogger ----------

  private bloggerTargets(): BloggerTarget[] {
    const targets: BloggerTarget[] = [];
    for (const name of ['TRENDING', 'CLASSICS', 'SILVER']) {
      const clientId = this.config.get<string>(`BLOGGER_${name}_CLIENT_ID`);
      const clientSecret = this.config.get<string>(`BLOGGER_${name}_CLIENT_SECRET`);
      const refreshToken = this.config.get<string>(`BLOGGER_${name}_REFRESH_TOKEN`);
      const blogId = this.config.get<string>(`BLOGGER_${name}_BLOG_ID`);
      if (clientId && clientSecret && refreshToken && blogId) {
        targets.push({ name, clientId, clientSecret, refreshToken, blogId });
      }
    }
    return targets;
  }

  private async getGoogleAccessToken(clientId: string, clientSecret: string, refreshToken: string): Promise<string> {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });
    const body = await res.json();
    if (!res.ok || !body.access_token) {
      throw new Error(`Google token refresh failed: ${JSON.stringify(body)}`);
    }
    return body.access_token;
  }

  private async postToBlogger(target: BloggerTarget, input: CrossPostInput): Promise<void> {
    const accessToken = await this.getGoogleAccessToken(target.clientId, target.clientSecret, target.refreshToken);
    const content = input.imageUrl
      ? `<img src="${input.imageUrl}" alt="${input.title}" style="max-width:100%;" /><br/>${input.contentHtml}`
      : input.contentHtml;

    const res = await fetch(`https://www.googleapis.com/blogger/v3/blogs/${target.blogId}/posts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title: input.title, content }),
    });
    const body = await res.json();
    if (!res.ok) {
      throw new Error(`Blogger(${target.name}) post failed: ${JSON.stringify(body)}`);
    }
    this.logger.log(`Posted to Blogger(${target.name}): ${body.url ?? body.id ?? 'ok'}`);
  }

  // ---------- WordPress.com ----------

  private wordPressTargets(): WordPressTarget[] {
    const targets: WordPressTarget[] = [];
    for (const name of ['CLASSICS', 'BUDDHIST', 'TRENDING', 'SILVER']) {
      const site = this.config.get<string>(`WORDPRESS_${name}_SITE`);
      const accessToken = this.config.get<string>(`WORDPRESS_${name}_ACCESS_TOKEN`);
      if (site && accessToken) {
        targets.push({ name, site, accessToken });
      }
    }
    return targets;
  }

  private async postToWordPress(target: WordPressTarget, input: CrossPostInput): Promise<void> {
    const content = input.imageUrl
      ? `<img src="${input.imageUrl}" alt="${input.title}" style="max-width:100%;" /><br/>${input.contentHtml}`
      : input.contentHtml;

    const res = await fetch(
      `https://public-api.wordpress.com/rest/v1.1/sites/${target.site}/posts/new`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${target.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: input.title, content, status: 'publish' }),
      },
    );
    const body = await res.json();
    if (!res.ok) {
      throw new Error(`WordPress(${target.name}) post failed: ${JSON.stringify(body)}`);
    }
    this.logger.log(`Posted to WordPress(${target.name}): ${body.URL ?? body.ID ?? 'ok'}`);
  }

  // ---------- Tumblr (OAuth 1.0a) ----------

  private oauth1Header(
    method: string,
    url: string,
    consumerKey: string,
    consumerSecret: string,
    accessToken: string,
    accessTokenSecret: string,
    extraParams: Record<string, string> = {},
  ): string {
    const oauthParams: Record<string, string> = {
      oauth_consumer_key: consumerKey,
      oauth_nonce: crypto.randomBytes(16).toString('hex'),
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
      oauth_token: accessToken,
      oauth_version: '1.0',
    };

    const allParams = { ...oauthParams, ...extraParams };
    const encode = (s: string) => encodeURIComponent(s).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);

    const paramString = Object.keys(allParams)
      .sort()
      .map((k) => `${encode(k)}=${encode(allParams[k])}`)
      .join('&');

    const baseString = `${method.toUpperCase()}&${encode(url)}&${encode(paramString)}`;
    const signingKey = `${encode(consumerSecret)}&${encode(accessTokenSecret)}`;
    const signature = crypto.createHmac('sha1', signingKey).update(baseString).digest('base64');

    const headerParams = { ...oauthParams, oauth_signature: signature };
    const header = Object.keys(headerParams)
      .sort()
      .map((k) => `${encode(k)}="${encode(headerParams[k])}"`)
      .join(', ');

    return `OAuth ${header}`;
  }

  private async postToTumblr(input: CrossPostInput): Promise<void> {
    const consumerKey = this.config.get<string>('TUMBLR_CONSUMER_KEY');
    const consumerSecret = this.config.get<string>('TUMBLR_CONSUMER_SECRET');
    const accessToken = this.config.get<string>('TUMBLR_ACCESS_TOKEN');
    const accessTokenSecret = this.config.get<string>('TUMBLR_ACCESS_TOKEN_SECRET');
    const blogName = this.config.get<string>('TUMBLR_BLOG_NAME');
    if (!consumerKey || !consumerSecret || !accessToken || !accessTokenSecret || !blogName) return;

    const url = `https://api.tumblr.com/v2/blog/${blogName}/post`;
    const body = input.imageUrl
      ? `<img src="${input.imageUrl}" alt="${input.title}" style="max-width:100%;" /><br/>${input.contentHtml}`
      : input.contentHtml;
    const params = { type: 'text', title: input.title, body };

    const authHeader = this.oauth1Header('POST', url, consumerKey, consumerSecret, accessToken, accessTokenSecret, params);

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(params),
    });
    const responseBody = await res.json();
    if (!res.ok) {
      throw new Error(`Tumblr post failed: ${JSON.stringify(responseBody)}`);
    }
    this.logger.log(`Posted to Tumblr: ${responseBody.response?.id ?? 'ok'}`);
  }
}
