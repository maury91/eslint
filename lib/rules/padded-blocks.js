/**
 * @fileoverview A rule to ensure blank lines within blocks.
 * @author Mathias Schreck <https://github.com/lo1tuma>
 * @copyright 2014 Mathias Schreck. All rights reserved.
 */

"use strict";

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = function(context) {
    var requirePadding = context.options[0] !== "never";

    var ALWAYS_MESSAGE = "Block must be padded by blank lines.",
        NEVER_MESSAGE = "Block must not be padded by blank lines.";

    var sourceCode = context.getSourceCode();

    /**
     * Gets the open brace token from a given node.
     * @param {ASTNode} node - A BlockStatement or SwitchStatement node from which to get the open brace.
     * @returns {Token} The token of the open brace.
     */
    function getOpenBrace(node) {
        if (node.type === "SwitchStatement") {
            return sourceCode.getTokenBefore(node.cases[0]);
        }
        return sourceCode.getFirstToken(node);
    }

    /**
     * Checks if the given parameter is a comment node
     * @param {ASTNode|Token} node An AST node or token
     * @returns {boolean} True if node is a comment
     */
    function isComment(node) {
        return node.type === "Line" || node.type === "Block";
    }

    /**
     * Checks if the given non empty block node has a blank line before its first child node.
     * @param {ASTNode} node The AST node of a BlockStatement.
     * @returns {boolean} Whether or not the block starts with a blank line.
     */
    function isBlockTopPadded(node) {
        var openBrace = getOpenBrace(node),
            blockStart = openBrace.loc.start.line,
            expectedFirstLine = blockStart + 2,
            first,
            firstLine;

        first = openBrace;
        do {
            first = sourceCode.getTokenOrCommentAfter(first);
        } while (isComment(first) && first.loc.start.line === blockStart);

        firstLine = first.loc.start.line;
        return expectedFirstLine <= firstLine;
    }

    /**
     * Checks if the given non empty block node has a blank line after its last child node.
     * @param {ASTNode} node The AST node of a BlockStatement.
     * @returns {boolean} Whether or not the block ends with a blank line.
     */
    function isBlockBottomPadded(node) {
        var closeBrace = sourceCode.getLastToken(node),
            blockEnd = closeBrace.loc.end.line,
            expectedLastLine = blockEnd - 2,
            last,
            lastLine;

        last = closeBrace;
        do {
            last = sourceCode.getTokenOrCommentBefore(last);
        } while (isComment(last) && last.loc.end.line === blockEnd);

        lastLine = last.loc.end.line;
        return lastLine <= expectedLastLine;
    }

    /**
     * Checks the given BlockStatement node to be padded if the block is not empty.
     * @param {ASTNode} node The AST node of a BlockStatement.
     * @returns {void} undefined.
     */
    function checkPadding(node) {
        var blockHasTopPadding = isBlockTopPadded(node),
            blockHasBottomPadding = isBlockBottomPadded(node);
        if (requirePadding) {
            if (!blockHasTopPadding) {
                context.report(node, ALWAYS_MESSAGE);
            }
            if (!blockHasBottomPadding) {
                context.report({
                    node: node,
                    loc: {line: node.loc.end.line, column: node.loc.end.column - 1 },
                    message: ALWAYS_MESSAGE
                });
            }
        } else {
            if (blockHasTopPadding) {
                context.report(node, NEVER_MESSAGE);
            }

            if (blockHasBottomPadding) {
                context.report({
                    node: node,
                    loc: {line: node.loc.end.line, column: node.loc.end.column - 1 },
                    message: NEVER_MESSAGE
                });
            }
        }
    }

    return {
        "SwitchStatement": function(node) {
            if (node.cases.length === 0) {
                return;
            }
            checkPadding(node);
        },
        "BlockStatement": function(node) {
            if (node.body.length === 0) {
                return;
            }
            checkPadding(node);
        }
    };

};

module.exports.schema = [
    {
        "enum": ["always", "never"]
    }
];
