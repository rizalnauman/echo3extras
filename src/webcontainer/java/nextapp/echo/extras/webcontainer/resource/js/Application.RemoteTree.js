/* 
 * This file is part of the Echo Web Application Framework (hereinafter "Echo").
 * Copyright (C) 2002-2007 NextApp, Inc.
 *
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 */

ExtrasApp.RemoteTree = Core.extend(EchoApp.Component, {
});

/**
 * @class Class for managing the tree structure. The tree structure is based on nodes 
 *          (ExtrasApp.RemoteTree.TreeNode) that have an id. This class stores all nodes
 *          in a map based on their id. 
 */
ExtrasApp.RemoteTree.TreeStructure = Core.extend({
    
    /**
     * Creates a new TreeStructure object.
     * 
     * @param {ExtrasApp.RemoteTree.TreeNode} rootNode the root node
     * @constructor
     */
    $construct: function(rootNode) { 
        this._idNodeMap = {};
        this._rootNode = rootNode;
        this._headerNode = null;
        this.addNode(rootNode);
    },
    
    /**
     * Gets the node with the given id.
     * 
     * @param id the id of the node
     * 
     * @return the node
     * @type ExtrasApp.RemoteTree.TreeNode
     */
    getNode: function(id) {
        return this._idNodeMap[id];
    },
    
    /**
     * Adds node to this structure. If node has a parent id, the node will be added
     * to the node with the parent id. Any child nodes will be added as well.
     * 
     * @param {ExtrasApp.RemoteTree.TreeNode} node the node to add
     */
    addNode: function(node) {
        this._idNodeMap[node.getId()] = node;
        if (node.getParentId()) {
            var parentNode = this.getNode(node.getParentId());
            if (parentNode) {
                parentNode.addChildNode(node);
            }
            this.addChildNodes(node);
        }
    },
    
    /**
     * Adds all child nodes of node to this structure.
     * 
     * @see #addNode
     * 
     * @param {ExtrasApp.RemoteTree.TreeNode} node the node to add the child nodes from
     */
    addChildNodes: function(node) {
        var childCount = node.getChildNodeCount();
        for (var i = 0; i < childCount; ++i) {
            var childNode = node.getChildNode(i);
            this.addNode(childNode);
        }
    },
    
    /**
     * Removes the given node from this structure. If node provides a parent id
     * this method will remove the node from it's parent node. Any child nodes 
     * will be automatically removed.
     * 
     * @param {ExtrasApp.RemoteTree.TreeNode} node the node to remove
     */
    removeNode: function(node) {
        this.removeChildNodes(node);
        if (node.getParentId()) {
            var parentNode = this.getNode(node.getParentId());
            this.getNode(node.getParentId()).removeChildNode(node);
        }
        delete this._idNodeMap[node.getId()];
    },
    
    /**
     * Removes all child node of the given node from this structure.
     * 
     * @see removeNode
     * 
     * @param {ExtrasApp.RemoteTree.TreeNode} node the node to remove the child nodes of
     */
    removeChildNodes: function(node) {
        var childCount = node.getChildNodeCount();
        for (var i = 0; i < childCount; ++i) {
            var childNode = node.getChildNode(0);
            this.removeNode(childNode);
        }
    },
    
    /**
     * Gets the root node of this structure.
     * 
     * @return the root node
     * @type ExtrasApp.RemoteTree.TreeNode
     */
    getRootNode: function() {
        return this._rootNode;
    },
    
    /**
     * Gets the depth of the deepest visible node. The root node is at depth 1, every
     * level increments the depth by one.
     * 
     * @return the maximum depth
     * @type Integer
     */
    getMaxDepth: function() {
        return this._getMaxDepth(this.getRootNode());
    },
    
    _getMaxDepth: function(node) {
        //FIXME what about performance?
        var maxDepth = 0;
        if (node.isExpanded()) {
            var childCount = node.getChildNodeCount();
            for (var i = 0; i < childCount; ++i) {
                var childNode = node.getChildNode(i);
                var childDepth = this._getMaxDepth(childNode);
                if (childDepth > maxDepth) {
                    maxDepth = childDepth;
                }
            }
        }
        return maxDepth + 1;
    },
    
    /**
     * Gets the depth of node.
     * 
     * @see getMaxDepth
     * 
     * @param {ExtrasApp.RemoteTree.TreeNode} node the node to get the depth for
     * 
     * @return the depth of node
     * @type Integer
     */
    getNodeDepth: function(node) {
        var depth = 1;
        var parentNode = this.getNode(node.getParentId());
        while (parentNode) {
            ++depth;
            parentNode = this.getNode(parentNode.getParentId());
        }
        return depth;
    },
    
    /**
     * Determines whether node has a next sibling on the same level.
     * 
     * @param {ExtrasApp.RemoteTree.TreeNode} node the node to check
     * 
     * @return true if node has a next sibling, false if not
     * @type Boolean
     */
    hasNodeNextSibling: function(node) {
        if (!node.getParentId()) {
            return false;
        }
        var parentNode = this.getNode(node.getParentId());
        return parentNode.indexOf(node) < (parentNode.getChildNodeCount() - 1);
    },
    
    /**
     * Gets the next sibling of node.
     * 
     * @param {ExtrasApp.RemoteTree.TreeNode} node the node to get the next sibling for
     * @param {Boolean} useParentSibling if true, the next sibling of the parent node of node
     *          will be returned if node has no next sibling on the same level
     * 
     * @return the next sibling, or null if it does not exist.
     * @type ExtrasApp.RemoteTree.TreeNode
     */
    getNodeNextSibling: function(node, useParentSibling) {
        if (!node.getParentId()) {
            return null;
        }
        var parentNode = this.getNode(node.getParentId());
        if (!this.hasNodeNextSibling(node)) {
            if (useParentSibling) {
                return this.getNodeNextSibling(parentNode, true);
            } else {
                return null;
            }
        }
        return parentNode.getChildNode(parentNode.indexOf(node) + 1);
    },
    
    /**
     * Sets the header node.
     * 
     * @param the node that represents the header row
     */
    setHeaderNode: function(node) {
        this._headerNode = node;
        this.addNode(node);
    },
    
    /**
     * Gets the header node. The header node is not part of the structure.
     * 
     * @return the node that represents the header row
     * @type ExtrasApp.RemoteTree.TreeNode
     */
    getHeaderNode: function() {
        return this._headerNode;
    },
    
    /**
     * Returns a depth-first iterator that iterates through node and all it's child nodes.
     * 
     * @param {ExtrasApp.RemoteTree.TreeNode} node the node to start the iteration
     * @param {Boolean} includeHidden true if hidden nodes should be included, false if not
     * @param {ExtrasApp.RemoteTree.TreeNode} endNode the node that ends the iteration, if endNode
     *          is encountered the iterator stops and returns null for subsequent calls
     * 
     * @return the iterator
     * @type Object
     */
    iterator: function(node, includeHidden, endNode) {
        if (!endNode) {
            endNode = node;
        }
        var structure = this;
        return {
            currNode: null,
            endNode: structure.getNodeNextSibling(endNode),
            end: false,
            _nextNode: null,
            nextNode: function() {
                if (!this.hasNext()) {
                    return null;
                }
                this.currNode = this._nextNode;
                this._nextNode = null;
                return this.currNode;
            },
            hasNext: function() {
                if (this.end) {
                    return false;
                }
                var next;
                if (this._nextNode) {
                    next = this._nextNode;
                } else {
                    next = this._getNext();
                    this._nextNode = next;
                }
                if (!next || next.equals(this.endNode)) {
                    this.end = true;
                    return false;
                }
                return true;
            },
            _getNext: function() {
                if (this.currNode) {
                    if (this.currNode.getChildNodeCount() > 0 && (includeHidden || this.currNode.isExpanded())) {
                        return this.currNode.getChildNode(0);
                    } else {
                        return structure.getNodeNextSibling(this.currNode, true);
                    }
                } else {
                    return node;
                }
            }
        };
    },
    
    /**
     * Gets a string representation of this tree structure
     */
    $toString: function() {
        var str = "treeStructure [\n";
        str += this.getNodeString(this.getRootNode(), "  ");
        str += "\n]";
        return str;
    },
    
    getNodeString: function(node, indentString) {
        var str = indentString + "node id=" + node._id;
        indentString += "  ";
        var childCount = node.getChildNodeCount();
        for (var i = 0; i < childCount; ++i) {
            str += "\n" + indentString + this.getNodeString(node.getChildNode(i), indentString + "  ");
        }
        return str;
    }
});

/**
 * @class Represents a tree node
 */
ExtrasApp.RemoteTree.TreeNode = Core.extend({
    /**
     * Constructs a new tree node object
     * 
     * @param id the id of the node
     * @param parentId the id of the parent node, null is only allowed for the root node
     * 
     * @constructor
     */
    $construct: function(id, parentId) { 
        this._id = id;
        this._parentId = parentId;
        this._childNodes = [];
        this._columns = [];
        this._expanded = false;
        this._leaf = false;
    },
    
    /**
     * Gets the id of this node
     * 
     * @return the id
     */
    getId: function() {
        return this._id;
    },
    
    /**
     * Gets the id of the parent node, if null, this node is considered the root node.
     * 
     * @return the id of the parent node
     */
    getParentId: function() {
        return this._parentId;
    },
    
    /**
     * Determines if node is a child node of this node.
     * 
     * @param {ExtrasApp.RemoteTree.TreeNode} node the node to check
     * 
     * @return true if node is a child node of this node, false otherwise
     * @type Boolean
     */
    containsChildNode: function(node) {
        return Core.Arrays.indexOf(this._childNodes, node) != -1;
    },
    
    /**
     * Adds node as a child node to this node, if an equal node already exists
     * in the child array, the original child node is replaced with the specified one.
     * 
     * @param {ExtrasApp.RemoteTree.TreeNode} node the node to add
     */
    addChildNode: function(node) {
        var index = Core.Arrays.indexOf(this._childNodes, node);
        if (index == -1) {
            this._childNodes.push(node);
        } else {
            this._childNodes[index] = node;
        }
        if (!this.containsChildNode(node)) {
            this._childNodes.push(node);
        }
    },
    
    /**
     * Removes node as a child node of this node.
     * 
     * @param {ExtrasApp.RemoteTree.TreeNode} node the node to remove as a child node
     */
    removeChildNode: function(node) {
        this._childNodes.splice(this._childNodes.indexOf(node), 1);
    },
    
    /**
     * Gets the child at index index of this node's child array.
     * 
     * @param {Integer} index the index of the child node
     * 
     * @return the child node at the given index, or null if the index is invalid
     * @type ExtrasApp.RemoteTree.TreeNode
     */
    getChildNode: function(index) {
        return this._childNodes[index];
    },
    
    /**
     * Gets the amount of child nodes of this node.
     * 
     * @return the amount of child nodes
     * @type Integer 
     */
    getChildNodeCount: function() {
        return this._childNodes.length;
    },
    
    /**
     * Adds column to this node.
     * 
     * @param columnId the id of the column 
     */
    addColumn: function(columnId) {
        this._columns.push(columnId);
    },
    
    /**
     * Gets the id of the column at the given index of this node's column array
     * 
     * @param {Integer} index the index of the column
     * 
     * @return the column id
     */
    getColumn: function(index) {
        return this._columns[index];
    },
    
    /**
     * Sets the expanded state of this node.
     * 
     * @param {Boolean} newState the new expanded state
     */
    setExpanded: function(newState) {
        this._expanded = newState;
    },
    
    /**
     * Gets the expanded state of this node.
     * 
     * @return true if this node is expanded, false if not
     * @type Boolean
     */
    isExpanded: function() {
        return this._expanded;
    },
    
    /**
     * Sets whether this node is a leaf or not.
     * 
     * @param {Boolean} newValue true if this node is a leaf, false if not
     */
    setLeaf: function(newValue) {
        this._leaf = newValue;
    },
    
    /**
     * Determines whether this node is a leaf or not.
     * 
     * @return true if this node is a leaf, false if not
     * @type Boolean
     */
    isLeaf: function() {
        return this._leaf;
    },
    
    /**
     * Gets the index of node in the node's child array.
     * 
     * @param {ExtrasApp.RemoteTree.TreeNode} node the node to get the index for
     * 
     * @return the index of node, -1 if node is not a child node of this node
     * @type Integer
     */
    indexOf: function(node) {
        return Core.Arrays.indexOf(this._childNodes, node);
    },
    
    /**
     * Checks if this node is equal to that.
     * 
     * @param {ExtrasApp.RemoteTree.TreeNode} that the node to test
     * 
     * @return true if the nodes are equal, false if not
     * @type Boolean
     */
    equals: function(that) {
        if (that == null || that._id == null) {
            return false;
        }
        return this._id == that._id;
    },
    
    /**
     * Returns a string representation of this node.
     * 
     * @return the string representation
     * @type String
     */
    $toString: function() {
        return "[node id: " + this._id + "]";
    }
});

/**
 * Creates a new selection update
 * 
 * @constructor
 * @class Class to keep track of selection updates.
 */
ExtrasApp.RemoteTree.SelectionUpdate = Core.extend({

    className: "ExtrasApp.RemoteTree.SelectionUpdate",

    $construct: function() {
    
        this._addedSelections = [];
        this._removedSelections = [];
        /**
         * indicating whether the selection must be cleared before applying this update.
         */
        this.clear = false;
    },
    
    /**
     * Adds row to the added selections of this update
     * 
     * @param row the row to add
     */
    addSelection: function(row) {
        this._addedSelections.push(row);
    },
    
    /**
     * Adds row to the removed selections of this update
     * 
     * @param row the row to add
     */
    removeSelection: function(row) {
        this._removedSelections.push(row);
    },
    
    /**
     * Checks if this update object contains added selections.
     * 
     * @return true if we have added selections
     * @type Boolean
     */
    hasAddedSelections: function() {
        return this._addedSelections.length > 0;
    },
    
    /**
     * Checks if this update object contains removed selections.
     * 
     * @return true if we have removed selections
     * @type Boolean
     */
    hasRemovedSelections: function() {
        return this._removedSelections.length > 0;
    },
    
    /**
     * Gets all added selections.
     * 
     * @return an array of all added selections
     * @type Array
     */
    getAddedSelections: function() {
        return this._addedSelections;
    },
    
    /**
     * Gets all removed selections.
     * 
     * @return an array of all removed selections
     * @type Array
     */
    getRemovedSelections: function() {
        return this._removedSelections;
    }
});

/**
 * Minimalistic representation of TreeSelectionModel.
 * 
 * @param {Number} selectionMode the selectionMode
 * @constructor
 */
ExtrasApp.TreeSelectionModel = Core.extend({
    
    $static: {
        /**
         * Value for selection mode setting indicating single selection.
         * 
         * @type Number
         * @final
         */
        SINGLE_SELECTION: 0,
            
        /**
         * Value for selection mode setting indicating multiple selection.
         * 
         * @type Number
         * @final
         */
        MULTIPLE_SELECTION: 2
    },
    
    $construct: function(selectionMode) { 
        this._selectionState = [];
        this._selectionMode = selectionMode;
    },
    
    /**
     * Returns whether the model is in single-selection mode. 
     * 
     * @return true if in single-selection mode
     * @type Boolean
     */
    isSingleSelection: function() {
        return this._selectionMode == ExtrasApp.TreeSelectionModel.SINGLE_SELECTION;
    },
    
    /**
     * Gets the selection mode.
     * 
     * @return the selection mode
     * @type Number
     */
    getSelectionMode: function() {
        return this._selectionMode;
    },
    
    /**
     * Adds node to the current selection.
     * 
     * @param node the node to add to the selection
     */
    addSelectedNode: function(node) {
        if (Core.Arrays.indexOf(this._selectionState, node) == -1) {
            this._selectionState.push(node);
        }
    },
    
    /**
     * Removes node from the current selection
     * 
     * @param node the node to remove from the selection
     */
    removeSelectedNode: function(node) {
        Core.Arrays.remove(this._selectionState, node);
    },
    
    /**
     * Sets the selection state of node.
     * If newValue is false, the node is removed from the current selection. 
     * If newValue is true, the node is added to the current selection.
     * 
     * @see #addSelectedNode
     * @see #removeSelectedNode
     * 
     * @param node the node
     * @param {Boolean} newValue the new selection state
     */
    setSelectionState: function(node, newValue) {
        if (newValue) {
            this.addSelectedNode(node);
        } else {
            this.removeSelectedNode(node);
        }
    },
    
    /**
     * Gets an array of the currently selected nodes. 
     * This array may be iterated, but should not be modified.
     * 
     * @return the currently selected nodes
     * @type Array
     */
    getSelectedNodes: function() {
        return this._selectionState;
    },
    
    /**
     * Determines whether a node is selected.
     * 
     * @param node the node
     * 
     * @return true if the node is selected, false if not
     * @type Boolean 
     */
    isNodeSelected: function(node) {
        return Core.Arrays.indexOf(this._selectionState, node) != -1;
    },
    
    /**
     * Determines whether the selection model is empty
     * 
     * @return true if no nodes are selected
     * @type Boolean
     */
    isSelectionEmpty: function() {
        return this._selectionState.length == 0;
    },
    
    /**
     * Checks if the given array with node ids contains the same nodes as the 
     * current selection.
     * 
     * @param {Array} array of node ids
     * 
     * @return true if the array is equal to the current selection, false if not
     * @type Boolean
     */
    equalsSelectionIdArray: function(selection) {
        if (this._selectionState.length != selection.length) {
            return false;
        }
        for (var i = 0; i < this._selectionState.length; ++i) {
            if (Core.Arrays.indexOf(selection, this._selectionState[i].getId()) == -1) {
                return false;
            }
        }
        return true;
    }
});
