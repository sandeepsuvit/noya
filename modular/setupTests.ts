// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom/extend-expect';

import fs from 'fs';
import { toMatchImageSnapshot } from 'jest-image-snapshot';
import nock from 'nock';
import { setPublicPath } from 'noya-public-path';
import path from 'path';
import util from 'util';

expect.extend({ toMatchImageSnapshot });

// https://reactjs.org/docs/testing-environments.html#mocking-a-rendering-surface
jest.mock('scheduler', () => require('scheduler/unstable_mock'));

// Polyfills for node
window.TextEncoder = window.TextEncoder ?? util.TextEncoder;
window.TextDecoder = window.TextDecoder ?? util.TextDecoder;
File.prototype.arrayBuffer = File.prototype.arrayBuffer || arrayBuffer;
Blob.prototype.arrayBuffer = Blob.prototype.arrayBuffer || arrayBuffer;

function arrayBuffer(this: Blob) {
  return new Promise((resolve) => {
    const fileReader = new FileReader();
    fileReader.onload = () => {
      resolve(fileReader.result);
    };
    fileReader.readAsArrayBuffer(this);
  });
}

const pathToPublic = path.join(__dirname, '..', 'packages', 'app', 'public');

setPublicPath(pathToPublic);

// Mock the http requests for wasm files
nock('http://localhost')
  .get(/.wasm|.ttf$/)
  .reply(200, (uri) => {
    const match = uri.match(/public\/(.+)$/);

    if (!match) throw new Error(`Bad nock url: ${uri}`);

    return fs.createReadStream(path.join(pathToPublic, match[1]));
  })
  .persist();
