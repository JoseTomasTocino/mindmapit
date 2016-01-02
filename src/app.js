import TreeNode from './js/TreeNode.js';
import * as utils from './js/Util.js';
import parseList from './js/Parser.js';

var YAML = require('yamljs');

var vm = new Vue({
    el: '.content',
    data: {
        sourceCode: 'Something something',
        currentTree: undefined
    },
    methods: {
        parseSource: function () {
            console.log("Parsing...");

            try {
                //var parsed = YAML.parse(this.sourceCode);
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
            var branchLabel = branch.label;
            var branchChildren = branch.children;

            var node = new TreeNode(branchLabel, isRoot);

            for (var child of branchChildren) {
                node.addChild(this.parseObjectBranch(child, false));
            }

            return node;
        },

        regenerateDiagram: function () {
            var canvas = document.getElementById("canvas");
            var ctx = canvas.getContext("2d");

            // Resize canvas to the available size
            canvas.width = canvas.clientWidth;
            canvas.height = canvas.clientHeight;

            if (!(this.currentTree instanceof TreeNode)) {
                console.log("Not a valid tree", this.currentTree);
                return;
            }

            var shit = this.currentTree.draw();
            canvas.width = shit.width + 25;
            canvas.height = shit.height + 25;

            ctx.drawImage(shit, 25, 25);
        }
    }
});

//window.addEventListener('resize', vm.regenerateDiagram);

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

var maxDepth = 4;
var maxChildren = 5;


var generateRandomChildren = function (node, depth = 0) {
    if (depth == maxDepth) return;

    var numChildren = utils.getRandomInt(0, maxChildren);

    for (var i = 0; i < numChildren; ++i) {
        //var child = new TreeNode("Ch" + i + "d" + depth);
        var child = new TreeNode(utils.getLoremIpsum(3));
        generateRandomChildren(child, depth + 1);
        node.addChild(child);
    }
};

//generateRandomChildren(root);


//var a = new TreeNode('Hijo 1');
//var b = new TreeNode('Hijo 2');
//var c = new TreeNode('Hijo 3');
//
//root.addChildren(a, b, c);
//
//a.addChildren(
//    new TreeNode('Subh 1.1'),
//    new TreeNode('Subh 1.2'),
//    new TreeNode('Subh 1.3'),
//    new TreeNode('Subh 1.4')
//);
//
//b.addChildren(
//    new TreeNode('Subh 2.1'),
//    new TreeNode('Subh 2.2'),
//    new TreeNode('Subh 2.2'),
//    new TreeNode('Subh 2.2'),
//    new TreeNode('Subh 2.2'),
//    new TreeNode('Subh 2.2'),
//    new TreeNode('Subh 2.2'),
//    new TreeNode('Subh 2.2'),
//    new TreeNode('Subh 2.2'),
//    new TreeNode('Subh 2.3')
//);

//vm.currentTree = root;
vm.parseSource();
//vm.regenerateDiagram();