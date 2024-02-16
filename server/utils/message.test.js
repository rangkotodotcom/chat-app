// const { expect } = require("chai");
var expect = require('expect');
var { generateMessage } = require('./message');

describe('Generate Message', () => {
    it('should generate correct message object', () => {
        let from = "Admin",
            text = "Random Text",
            message = generateMessage(from, text);

        expect(typeof message.createdAt).toBe('number');
        expect(message).toMatchObject({ from, text });
    });
});