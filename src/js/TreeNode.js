import * as utils from './Util.js';

var connectorWidth = 50;
var connectorSteepness = 0.8;
var connectorLineWidth = 4.5;

var fontSize = 13;
var fontFamily = "Open Sans";

var labelPaddingBottom = 8;
var labelPaddingRight = 5

var leafMarginTop = 5;
var leafMarginBottom = 5;

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
            that.ctx.fillStyle = c;
            that.ctx.rect(x, y, w, h);
            that.ctx.stroke();
        };

        this.canvas = document.createElement("canvas");
        this.ctx = this.canvas.getContext("2d");

        // The width of the label will be the width of the widest line
        this.ctx.font = fontSize + "px " + fontFamily;
        this.labelWidth = Math.ceil(Math.max(...this.labelLines.map(c => this.ctx.measureText(c).width)));

        if (this.isLeaf) {
            this.canvas.width = this.labelWidth + labelPaddingRight * 2;
            this.canvas.height = fontSize * (this.labelLines.length + 1) + leafMarginTop + leafMarginBottom;
            this.ctx.font = fontSize + "px " + fontFamily;
            for (var i = 0; i < this.labelLines.length; i++) {
                this.ctx.fillText(this.labelLines[i], 0, fontSize * (i + 1));
            }

            // The anchorPoint defines where the line should start
            this.anchorPoint = {x: 0, y: (this.labelLines.length * fontSize) + labelPaddingBottom};
        }

        else {
            // If this is the root, we need to generate a random color for each branch
            if (this.isRoot) {
                var branchColors = this.children.map(c => utils.generateRandomColor());
                var canvases = this.children.map((c, i) => c.draw(branchColors[i]));
            }

            // Otherwise, used the received branchColor
            else {
                var canvases = this.children.map((c, i) => c.draw(currentBranchColor));
            }

            // Get the vertical positions for the children
            var vertical_positions = [0];

            // Each position is the sum of the acummulated heights of the previous elements
            for (var i = 0; i < canvases.length; i++) {
                vertical_positions[i + 1] = vertical_positions[i] + canvases[i].height;
            }

            // Compute left margin (label width + separation)
            var leftMargin = 10 + this.labelWidth + connectorWidth;

            // Set the width to the leftMargin plus the width of the widest child branch
            this.canvas.width = leftMargin + Math.max(...canvases.map(c => c.width));
            this.canvas.height = vertical_positions[canvases.length] + 5;
            this.ctx.font = fontSize + "px " + fontFamily;

            if (this.isRoot) {
                this.anchorPoint = {x: 10, y: this.canvas.height / 2 + fontSize / 2};
            }
            else {
                this.anchorPoint = {x: 0, y: this.canvas.height / 2 + fontSize / 2 + labelPaddingBottom};
            }

            for (var i = 0; i < canvases.length; i++) {
                if (this.isRoot) {
                    currentBranchColor = branchColors[i];
                }

                this.ctx.drawImage(canvases[i], leftMargin, vertical_positions[i]);

                var connector_a = {
                    x: this.anchorPoint.x + this.labelWidth + labelPaddingRight,
                    y: this.anchorPoint.y
                };

                var connector_b = {
                    x: leftMargin,
                    y: vertical_positions[i] + this.children[i].anchorPoint.y
                };

                this.ctx.beginPath();
                this.ctx.moveTo(connector_a.x, connector_a.y);

                this.ctx.bezierCurveTo(
                    connector_a.x + connectorSteepness * connectorWidth, connector_a.y,
                    connector_b.x - connectorSteepness * connectorWidth, connector_b.y,
                    connector_b.x, connector_b.y
                );

                this.ctx.lineTo(
                    connector_b.x + this.children[i].labelWidth + labelPaddingRight,
                    connector_b.y
                );
                this.ctx.lineWidth = connectorLineWidth;
                this.ctx.lineCap = "round";
                this.ctx.strokeStyle = currentBranchColor;
                this.ctx.stroke();
            }


            if (this.isRoot) {
                this.ctx.fillStyle = "#ffffff";
                this.ctx.lineWidth = 3;
                utils.roundRect(this.ctx,
                    2, this.canvas.height / 2 - (this.labelLines.length) * fontSize,
                    this.labelWidth + 18, fontSize * (this.labelLines.length + 1.5),
                    5, true, true);
            }
            this.ctx.fillStyle = "#000000";

            for (var i = 0; i < this.labelLines.length; i++) {
                this.ctx.fillText(
                    this.labelLines[i],
                    10,                                             // Fixed margin from the left
                    this.canvas.height / 2                          // Vertical center
                    + fontSize / 2                                  // Middle of the line height
                    - fontSize * (this.labelLines.length - i - 1)   // Correctly account for multilines
                );
            }
        }

        return this.canvas;
    }
};
