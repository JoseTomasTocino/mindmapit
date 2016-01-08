import * as utils from './Util.js';
import treeProperties from './TreeProperties.js';

var fontFamily = "Open Sans";

var labelPaddingBottom = 8;
var labelPaddingRight = 10;

var DEBUG = false;

export default class TreeNode {

    constructor(label, isRoot = false) {
        this.label = label;
        this.labelLines = this.label.split("\n");
        this.isRoot = isRoot;
        this.parent = undefined;
        this.children = [];
    }

    get isLeaf() {
        return this.children.length == 0;
    }

    addChild(child) {
        child.parent = this;
        this.children.push(child);
    }

    addChildren(...children) {
        for (var child of children) {
            this.addChild(child);
        }
    }

    draw(currentBranchColor) {
        var that = this;

        var dl = function (x, y, c = "#00ff00", w = 100) {
            that.ctx.fillStyle = c;
            that.ctx.fillRect(x, y, w, 1);
        };

        var dr = function (x, y, w, h, c = "#00ff00") {
            that.ctx.lineWidth = 1;
            that.ctx.strokeStyle = c;
            that.ctx.rect(x, y, w, h);
            that.ctx.stroke();
        };

        this.canvas = document.createElement("canvas");
        this.ctx = this.canvas.getContext("2d");

        // The width of the label will be the width of the widest line
        this.ctx.font = treeProperties.fontSize.val + "px " + fontFamily;

        // The height of the lines of text (only)
        this.textHeight = treeProperties.fontSize.val * (this.labelLines.length);

        // The height of the text + the separation from the line + the line height + the label margin
        this.composedHeight = this.textHeight + labelPaddingBottom + treeProperties.connectorLineWidth.val;

        // The composed height plus the margin
        this.paddedHeight = this.composedHeight + treeProperties.nodeMarginTop.val;

        this.labelHeight =
            treeProperties.nodeMarginTop.val +                           // top margin
            treeProperties.fontSize.val * (this.labelLines.length + 1) + // text lines' height
            treeProperties.nodeMarginBottom.val                          // bottom margin
        ;

        this.labelWidth = Math.ceil(Math.max(...this.labelLines.map(c => this.ctx.measureText(c).width)));

        if (this.isLeaf) {
            // Resize the canvas
            this.canvas.width = this.labelWidth + labelPaddingRight * 2;
            this.canvas.height = this.labelHeight;

            // Set the font
            this.ctx.font = treeProperties.fontSize.val + "px " + fontFamily;

            // Draw the text lines
            for (var i = 0; i < this.labelLines.length; i++) {
                this.ctx.fillText(this.labelLines[i], 0, treeProperties.fontSize.val * (i + 1) + treeProperties.nodeMarginTop.val);
            }

            // The anchorPoint defines where the line should start
            this.anchorPoint = {
                x: 0,
                y: (this.labelLines.length * treeProperties.fontSize.val) + labelPaddingBottom + treeProperties.nodeMarginTop.val
            };
        }

        else {
            // If this is the root, we need to generate a random color for each branch
            if (this.isRoot) {
                var branchColors = this.children.map(c => utils.generateRandomColor(treeProperties.useGrayscale));
                var canvases = this.children.map((c, i) => c.draw(branchColors[i]));
            }

            // Otherwise, use the received branchColor
            else {
                var canvases = this.children.map((c, i) => c.draw(currentBranchColor));
            }

            // Get the vertical positions for the children
            var childrenVerticalPositions = [0];

            // Each position is the sum of the acumulated heights of the previous elements
            for (var i = 0; i < canvases.length; i++) {
                childrenVerticalPositions[i + 1] = childrenVerticalPositions[i] + canvases[i].height;
            }

            let childrenHeight = childrenVerticalPositions[canvases.length];

            this.anchorPoint = {x: this.isRoot ? 10 : 0, y: 0};

            /*
             If the height of the children is smaller than the height of the node, take the height of the node and
             don't center it vertically.
             Otherwise, take the max between 2*height of the node and the children height, and center it vertically.
             */

            if (childrenHeight < this.composedHeight + treeProperties.nodeMarginTop.val * 2) {
                this.canvas.height = this.composedHeight + treeProperties.nodeMarginTop.val * 2;
                this.anchorPoint.y = this.canvas.height / 2 + this.composedHeight / 2;
            }
            else {
                this.canvas.height = Math.max(childrenVerticalPositions[canvases.length], this.composedHeight * 2);
                this.anchorPoint.y = this.canvas.height / 2;
            }

            console.log(this.label, this.canvas.height, childrenVerticalPositions[canvases.length]);

            // Compute left margin (label width + separation)
            var leftMargin = 10 + this.labelWidth + treeProperties.connectorWidth.val;

            // Set the width to the leftMargin plus the width of the widest child branch
            this.canvas.width = leftMargin + Math.max(...canvases.map(c => c.width));
            this.ctx.font = treeProperties.fontSize.val + "px " + fontFamily;


            // Draw each child
            for (var i = 0; i < canvases.length; i++) {
                if (this.isRoot) {
                    currentBranchColor = branchColors[i];
                }

                this.ctx.drawImage(canvases[i], leftMargin, childrenVerticalPositions[i]);

                var connector_a = {
                    x: this.anchorPoint.x + this.labelWidth + labelPaddingRight,
                    y: this.anchorPoint.y
                };

                var connector_b = {
                    x: leftMargin,
                    y: childrenVerticalPositions[i] + this.children[i].anchorPoint.y
                };

                this.ctx.beginPath();
                this.ctx.moveTo(connector_a.x, connector_a.y);

                this.ctx.bezierCurveTo(
                    connector_a.x + treeProperties.connectorSteepness.val * treeProperties.connectorWidth.val, connector_a.y,
                    connector_b.x - treeProperties.connectorSteepness.val * treeProperties.connectorWidth.val, connector_b.y,
                    connector_b.x, connector_b.y
                );

                this.ctx.lineTo(
                    connector_b.x + this.children[i].labelWidth + labelPaddingRight,
                    connector_b.y
                );
                this.ctx.lineWidth = treeProperties.connectorLineWidth.val;
                this.ctx.lineCap = "round";
                this.ctx.strokeStyle = currentBranchColor;
                this.ctx.stroke();
            }


            // For the root node, print a containing rectangle and always center the text
            if (this.isRoot) {
                this.ctx.fillStyle = "#ffffff";
                this.ctx.lineWidth = 3;
                utils.roundRect(this.ctx,
                    2, this.canvas.height / 2 - (this.labelLines.length) * treeProperties.fontSize.val,
                    this.labelWidth + 18, treeProperties.fontSize.val * (this.labelLines.length + 1.5),
                    5, true, true);

                this.ctx.fillStyle = "#000000";

                for (var i = 0; i < this.labelLines.length; i++) {
                    this.ctx.fillText(
                        this.labelLines[i],
                        10,                                             // Fixed margin from the left
                        this.canvas.height / 2                          // Vertical center
                        + treeProperties.fontSize.val / 2                                  // Middle of the line height
                        - treeProperties.fontSize.val * (this.labelLines.length - i - 1)   // Correctly account for multilines
                    );
                }
            }

            else {
                this.ctx.fillStyle = "#000000";

                for (var i = 0; i < this.labelLines.length; i++) {
                    this.ctx.fillText(
                        this.labelLines[i],
                        10,                                             // Fixed margin from the left
                        this.anchorPoint.y     // From the anchor point
                        - labelPaddingBottom   // Move up the padding
                        - treeProperties.fontSize.val * (this.labelLines.length - i - 1)
                    );
                }
            }
        }

        if (DEBUG) {
            dr(1, 1, this.canvas.width - 1, this.canvas.height - 1);
        }


        return this.canvas;
    }
};
