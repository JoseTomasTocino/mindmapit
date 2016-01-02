import TreeNode from './js/TreeNode.js';
import * as utils from './js/Util.js';
import parseList from './js/Parser.js';

var vm = new Vue({
    el: '.content',
    data: {
        sourceCode: '',
        currentTree: undefined
    },
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

            // Draw the map onto the existing canvas
            ctx.drawImage(beautifulDrawing, 25, 25);
        }
    }
});

vm.sourceCode =
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

vm.$watch('sourceCode', function (sourceCode) {
    vm.parseSource();
});

setTimeout(() => vm.parseSource(), 250);
