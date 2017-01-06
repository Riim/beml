import escapeString from 'escape-string';
import {
	NodeType as BemlNodeType,
	INode as IBemlNode,
	TContent as TBemlContent,
	IElement as IBemlElement,
	ITextNode as IBemlTextNode,
	default as Parser
} from './Parser';
import selfClosingTags from './selfClosingTags';
import renderAttributes from './renderAttributes';

let elDelimiter = '__';

export interface INode {
	elementName: string | null;
	source: Array<string>;
	hasSuperCall: boolean;
}

export interface IRenderer {
	(this: IElementRendererMap): string;
}

export interface IElementRenderer {
	(this: IElementRendererMap, $super?: IElementRenderer): string;
}

export interface IElementRendererMap {
	[name: string]: IElementRenderer;
}

export default class Template {
	static compile(beml: string): Template {
		return new Template(beml);
	}

	parent: Template | null;

	_classesTemplate: Array<string>;

	_currentNode: INode;
	_nodes: Array<INode>;
	_nodeMap: { [elName: string]: INode };

	_renderer: IRenderer;
	_elementRendererMap: IElementRendererMap;

	constructor(beml?: string, opts?: { parent?: Template, blockName?: string }) {
		let parent = this.parent = opts && opts.parent || null;

		if (beml !== undefined) {
			let block = new Parser(beml).parse();
			let blockName = opts && opts.blockName || block.name;

			if (!blockName) {
				throw new TypeError('blockName is required');
			}

			this._classesTemplate = parent ?
				[blockName + elDelimiter].concat(parent._classesTemplate) :
				[blockName + elDelimiter, ''];

			this._nodes = [(this._currentNode = { elementName: null, source: [], hasSuperCall: false })];
			let nodeMap = this._nodeMap = {} as { [elName: string]: INode };

			block.content.forEach(this._handleNode, this);

			this._renderer = parent ?
				parent._renderer :
				Function(`return [${ this._currentNode.source.join(', ') }].join('');`) as IRenderer;

			Object.keys(nodeMap).forEach(function(this: IElementRendererMap, name: string) {
				let node = nodeMap[name];

				if (node.hasSuperCall) {
					let inner = Function('$super', `return ${ node.source.join(' + ') };`) as IElementRenderer;
					let parentElementRenderer = parent && parent._elementRendererMap[name];
					this[name] = function() { return inner.call(this, parentElementRenderer); };
				} else {
					this[name] = Function(`return ${ node.source.join(' + ') };`) as IElementRenderer;
				}
			}, (this._elementRendererMap = Object.create(parent && parent._elementRendererMap) as IElementRendererMap));
		} else {
			let blockName = opts && opts.blockName;

			if (!blockName) {
				throw new TypeError('blockName is required');
			}

			if (!parent) {
				throw new TypeError('parent is required if beml is not defined');
			}

			this._classesTemplate = [blockName + elDelimiter].concat(parent._classesTemplate);

			this._renderer = parent._renderer;
			this._elementRendererMap = parent._elementRendererMap;
		}
	}

	_handleNode(node: IBemlNode) {
		switch (node.nodeType) {
			case BemlNodeType.ELEMENT: {
				let nodes = this._nodes;
				let el = node as IBemlElement;
				let tagName = el.tagName;
				let elName = el.name;
				let content = el.content;

				if (elName) {
					let currentNode = { elementName: elName, source: [], hasSuperCall: false };
					nodes.push((this._currentNode = currentNode));
					this._nodeMap[elName] = currentNode;
				}

				this._currentNode.source.push(
					`'<${ tagName }${ renderAttributes(this._classesTemplate, el) }>'`
				);

				let hasContent = content && content.length;

				if (hasContent) {
					(content as TBemlContent).forEach(this._handleNode, this);
				}

				if (hasContent || !(tagName in selfClosingTags)) {
					this._currentNode.source.push(`'</${ tagName }>'`);
				}

				if (elName) {
					nodes.pop();
					this._currentNode = nodes[nodes.length - 1];
					this._currentNode.source.push(`this['${ elName }']()`);
				}

				break;
			}
			case BemlNodeType.TEXT: {
				this._currentNode.source.push(`'${ escapeString((node as IBemlTextNode).value) }'`);
				break;
			}
			case BemlNodeType.SUPER_CALL: {
				this._currentNode.source.push(`$super.call(this)`);
				this._currentNode.hasSuperCall = true;
				break;
			}
		}
	}

	extend(beml?: string, opts?: { blockName?: string }): Template {
		return new Template(beml, { __proto__: opts || null, parent: this } as any);
	}

	render() {
		return this._renderer.call(this._elementRendererMap);
	}
}
