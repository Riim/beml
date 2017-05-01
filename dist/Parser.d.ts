export declare enum NodeType {
    BLOCK = 1,
    ELEMENT = 2,
    TEXT = 3,
    COMMENT = 4,
    SUPER_CALL = 5,
}
export interface INode {
    nodeType: NodeType;
}
export interface IBlockDeclaration {
    blockName: string;
}
export declare type TContent = Array<INode>;
export interface IBlock extends INode {
    nodeType: NodeType.BLOCK;
    declaration: IBlockDeclaration | null;
    name: string | null;
    content: TContent;
}
export interface ISuperCall extends INode {
    nodeType: NodeType.SUPER_CALL;
    elementName: string | null;
}
export interface IElementAttribute {
    name: string;
    value: string;
}
export declare type TElementAttributeList = Array<IElementAttribute>;
export interface IElementAttributes {
    superCall: ISuperCall | null;
    list: TElementAttributeList;
}
export interface IElement extends INode {
    nodeType: NodeType.ELEMENT;
    isHelper: boolean;
    tagName: string | null;
    names: Array<string | null> | null;
    attributes: IElementAttributes | null;
    content: TContent | null;
}
export interface ITextNode extends INode {
    nodeType: NodeType.TEXT;
    value: string;
}
export interface IComment extends INode {
    nodeType: NodeType.COMMENT;
    value: string;
    multiline: boolean;
}
export default class Parser {
    beml: string;
    at: number;
    chr: string;
    constructor(beml: string);
    parse(): IBlock;
    _readBlockDeclaration(): IBlockDeclaration;
    _readContent(brackets: boolean): TContent;
    _readElement(): IElement;
    _readAttributes(): IElementAttributes;
    _skipWhitespacesAndComments(): string;
    _readSuperCall(): ISuperCall | null;
    _readTextNode(): ITextNode;
    _readString(): {
        value: string;
        multiline: boolean;
    };
    _readComment(): IComment;
    _readElementNames(): Array<string | null> | null;
    _readName(reNameOrNothing: RegExp): string | null;
    _skipWhitespaces(): string;
    _next(current?: string): string;
}
