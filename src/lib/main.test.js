//????????????
// keyra coverage cmd 
import { write } from 'fs-extra';
import {writeHtml, readJson, escapeHtml, fileExists, folderExists, parseIndexJson, stringToHtml} from './main.js';
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

    describe('folderExists', ()  => {
        it('returns false if folder does not exist', async () => {
            const result = await folderExists('./src/ekkitil');
            expect(result).toEqual(false);
        })
        it('returns true if folder exists', async () => {
            const result = await folderExists('./src/testdata');
            expect(result).toEqual(true);
        })
    })

    describe('parseIndexJson()', () => {
        it('should only return valid items where file exists', async() => {
            const data = [
                { file: "slay.json", title: "slay" },
                { title: "file ekki til" }
              ];
            fileExists((filePath) => filePath === "./data/slay.json");
            const result = await parseIndexJson(data);
            expect(result).toBe[{file: "slay.json", title: "slay"}]
        })

    })
    describe('stringToHtml', () =>{
        it('should beautify html from a string with new lines', () => {
            expect(stringToHtml('<script>alert("XSS")</script>')).toBe("<p>&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;</p>");
        });
        it("should return an empty string for non-string inputs", () => {
            expect(stringToHtml(45)).toBe("<p></p>");
            expect(stringToHtml(null)).toBe("<p></p>");
        });
    })

    describe('writeHtml', () => {
        it('returns an index html template', () => {
            const data = [
                {
                    file: "slay.json"
                }
            ]
            const result = writeHtml(data);
            expect(result).toContain('<h2>Þetta er vissulega spurningaleikur :D</h2>');
        })
    })
})