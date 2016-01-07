import "babel-polyfill";
import TreeNode from './js/TreeNode.js';
import treeProperties from './js/TreeProperties.js';

import * as utils from './js/Util.js';
import parseList from './js/Parser.js';

global.jQuery = require('jquery');
require('ion-rangeslider');

(function () {

    var sliderContainer = document.querySelector(".sliders");

    for (var propName in treeProperties) {
        let prop = treeProperties[propName];

        if (prop.notConfigurable) continue;

        let field = document.createElement("div");
        field.classList.add("field");

        // Create and append the label and the input
        let label = document.createElement("label");
        let input = document.createElement("input");

        field.appendChild(label);
        field.appendChild(input);
        sliderContainer.appendChild(field);

        // Configure the label
        label.textContent = prop.label + ":";

        // Configure the input
        input.setAttribute("v-model", "treeProperties." + propName);
        input.value = prop.val;

        if (prop.type && prop.type == "boolean") {
            input.type = "checkbox"
        } else {
            input.type = "text";

            jQuery(input).ionRangeSlider({
                min: prop.min,
                max: prop.max,
                step: prop.step ? prop.step : 1
            });
        }
    }
})();


var vm_data = {
    'currentTree': undefined,
    'treeProperties': {}
}

vm_data.sourceCode =
    `- Programming
something I love
  - Web Development
    - Front-end development
(stuff for the browsers)
      - Languages
        - HTML
        - CSS
        - JavaScript
      - Tools
        - Bootstrap
    - Back-end development
(stuff for the server)
      - Languages
        - PHP
        - Python
      - Frameworks
        - Django
        - Symphony
  - Desktop development,
which is something pretty hard that
most web developers can't do
  - Mobile development
    - Android
    - iOS
    - Some other stuff
no one cares about
    - LOLWAT
`;


//vm_data.sourceCode =
//    `- Prog
// - This
// - That`;

for (var propName in treeProperties) {
    vm_data.treeProperties[propName] = treeProperties[propName].val;
}

var vm = new Vue({
    el: '.content',
    data: vm_data,
    methods: {
        parseSource: function () {
            console.log("Parsing...");

            try {
                var parsed = parseList(this.sourceCode);
            } catch (err) {
                console.log("Woops! Error parsing");

                return;
            }

            if (parsed.length == 0) return;
            parsed = parsed.children[0];

            vm.currentTree = this.parseObjectBranch(parsed, true);
            vm.regenerateDiagram();
        },

        parseObjectBranch: function (branch, isRoot = false) {
            var node = new TreeNode(branch.label, isRoot);

            for (var child of branch.children) {
                node.addChild(this.parseObjectBranch(child, false));
            }

            return node;
        },

        regenerateDiagram: function () {
            var canvas = document.getElementById("canvas");
            var ctx = canvas.getContext("2d");

            if (!(this.currentTree instanceof TreeNode)) {
                console.log("Not a valid tree", this.currentTree);
                return;
            }

            // Draw the map
            var beautifulDrawing = this.currentTree.draw();

            // Resize canvas to the size of the map plus some margin
            canvas.width = beautifulDrawing.width + 25;
            canvas.height = beautifulDrawing.height + 25;

            console.log("Canvas", canvas.width, canvas.height);

            // Draw the map onto the existing canvas
            ctx.drawImage(beautifulDrawing, 25, 25);
        },

        buildGlobalProperties: function () {
            for (var propName in treeProperties) {
                treeProperties[propName].val = Number(this.treeProperties[propName]);
            }

            this.parseSource();
        }
    },

    watch: {
        'sourceCode': 'parseSource',
        'treeProperties': {
            handler: 'buildGlobalProperties',
            deep: true
        },
    }
});


// Small delay to allow for the font to load
setTimeout(() => vm.parseSource(), 250);

