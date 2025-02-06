//????????????
// keyra coverage cmd og eih 
import {readJson, escapeHtml, fileExists} from './main.js';
import { describe, expect, it} from '@jest/globals';

const test_data = './src/testdata/data.json'

describe('main', () => {
    describe('readJson', () => {
        it ('parses a json file into data for js', async ()=>{
            const data = {
                "slay": "slay?"
            }
            const result = await readJson(test_data);
            expect(result).toMatchObject(data);
        });
        it ('returns null if no input is given', async ()=>{
            const result = await readJson();
            expect(result).toBe(null);
        })
    })

    describe('escapeHtml',() =>{
        it('should escape HTML special characters', async () =>{
        expect(escapeHtml('<script>alert("XSS")</script>')).toBe("&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;");
        });
        it("should return an empty string for non-string inputs", () => {
            expect(escapeHtml(45)).toBe("");
            expect(escapeHtml(null)).toBe("");
          });
    })

    describe('fileExists', ()  => {
        it('returns false if non-existent files', async () => {
            const result = await fileExists('./slay');
            expect(result).toEqual(false);
        })
        it('returns true if file exists', async () => {
            const result = await fileExists('./src/testdata/data.json');
            expect(result).toEqual(true);
        })
    })
})