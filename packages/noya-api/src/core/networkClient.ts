import { Size } from 'noya-geometry';
import { z } from 'zod';
import { NoyaAPIError } from './error';
import {
  noyaAssetSchema,
  noyaBillingSchema,
  NoyaExportFormat,
  NoyaFileData,
  noyaFileListSchema,
  noyaFileSchema,
  noyaSessionSchema,
} from './schema';

/**

GET /api/files/ list files
POST /api/files with { data: ... } create a file, ID is assigned, responds with 201, Location header for resource URL and { id: ..., data: ...}
PUT /api/files/[id] with { data: ... } updates the file with this, responds with { id: ..., data: ...}
GET /api/files/[id] responds with { id: ..., data: ...}
DELETE /api/files/[id]

unless otherwise specified, returns 200 on success or 4xx/5xx error

*/

export interface INoyaNetworkClient {
  auth: NoyaNetworkClient['auth'];
  files: NoyaNetworkClient['files'];
  assets: NoyaNetworkClient['assets'];
  billing: NoyaNetworkClient['billing'];
}

export class NoyaNetworkClient {
  baseURI: string;
  onError?: (error: NoyaAPIError) => boolean;

  constructor(options: {
    baseURI: string;
    onError?: (error: NoyaAPIError) => boolean;
  }) {
    this.baseURI = options.baseURI;
    this.onError = options.onError;
  }

  get auth() {
    return {
      session: this.#readSession,
    };
  }

  get files() {
    return {
      read: this.#readFile,
      create: this.#createFile,
      update: this.#updateFile,
      delete: this.#deleteFile,
      list: this.#listFiles,
      download: {
        url: this.downloadURL,
      },
    };
  }

  get assets() {
    return {
      create: this.#createAsset,
      url: this.#assetURL,
    };
  }

  get billing() {
    return {
      read: this.#readBilling,
    };
  }

  #readBilling = async () => {
    const response = await fetch(`${this.baseURI}/billing`, {
      credentials: 'include',
    });

    this.#ensureAuthorized(response);

    const json = await response.json();
    const parsed = noyaBillingSchema.parse(json);
    return parsed;
  };

  downloadURL = (id: string, format: NoyaExportFormat, size: Size) =>
    `${this.baseURI}/files/${id}.${format}?width=${size.width}&height=${size.height}`;

  #assetURL = (id: string) => `${this.baseURI}/assets/${id}`;

  #createAsset = async (data: ArrayBuffer, fileId: string) => {
    const response = await fetch(`${this.baseURI}/files/${fileId}/assets`, {
      method: 'POST',
      credentials: 'include',
      body: data,
    });

    this.#ensureAuthorized(response);

    const json = await response.json();
    const parsed = noyaAssetSchema.parse(json);
    return parsed.id;
  };

  #readSession = async () => {
    const response = await fetch(`${this.baseURI}/auth/session`, {
      credentials: 'include',
    });

    this.#ensureAuthorized(response);

    const json = await response.json();
    const parsed = noyaSessionSchema.parse(json);
    return parsed;
  };

  #readFile = async (id: string) => {
    const response = await fetch(`${this.baseURI}/files/${id}`, {
      credentials: 'include',
    });

    this.#ensureAuthorized(response);

    const json = await response.json();
    const parsed = noyaFileSchema.parse(json);
    return parsed;
  };

  #updateFile = async (id: string, data: NoyaFileData, version?: number) => {
    const response = await fetch(`${this.baseURI}/files/${id}`, {
      method: 'PUT',
      credentials: 'include',
      body: JSON.stringify({
        data,
        ...(version !== undefined && { version }),
      }),
    });

    this.#ensureAuthorized(response);
  };

  #listFiles = async () => {
    const response = await fetch(`${this.baseURI}/files`, {
      credentials: 'include',
    });

    this.#ensureAuthorized(response);

    const json = await response.json();
    const parsed = noyaFileListSchema.parse(json);
    return parsed;
  };

  #createFile = async (data: NoyaFileData) => {
    const response = await fetch(`${this.baseURI}/files`, {
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify({ data }),
    });

    this.#ensureAuthorized(response);

    const json = await response.json();
    const parsed = z.object({ id: z.string() }).parse(json);
    return parsed.id;
  };

  #deleteFile = async (id: string) => {
    const response = await fetch(`${this.baseURI}/files/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    this.#ensureAuthorized(response);
  };

  #ensureAuthorized = (response: Response) => {
    const handleError = (error: NoyaAPIError) => {
      if (this.onError) {
        const handled = this.onError(error);

        if (handled) {
          return;
        }
      }

      throw error;
    };

    if (response.status === 500) {
      handleError(new NoyaAPIError('internalServerError', response.statusText));
    } else if (response.status === 401) {
      handleError(new NoyaAPIError('unauthorized', response.statusText));
    } else if (response.status >= 400) {
      handleError(new NoyaAPIError('unknown', response.statusText));
    }
  };
}
