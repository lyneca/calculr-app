import * as React from 'react';

type ValueBlockProps = { title: string, value: number };
type ValueBlockState = { value: number };
class ValueBlock extends React.Component<ValueBlockProps, ValueBlockState> {
    constructor(props: ValueBlockProps) {
        super(props);
        this.state = {value: this.props.value};
        this.title = this.title.bind(this);
    }

    title() {
        return this.props.title.split("_").map(word => (word[0]?.toUpperCase() ?? '') + word.substr(1)).join(' ');
    }

    render() {
        return (
            <div className="block">
            <div className="title">{this.title()}</div>
            <div className="result">{this.props.value}</div>
            </div>
        );
    }
}
type InputBlockProps = { title: string, onChange: any, percent: boolean };
type InputBlockState = { value: number };
class InputBlock extends React.Component<InputBlockProps, InputBlockState> {
    constructor(props: InputBlockProps) {
        super(props);
        this.state = {value: 0};
        this.title = this.title.bind(this);
        this.handleChange = this.handleChange.bind(this);
    }

    handleChange(event: any) {
        let value = parseFloat(event.target.value);
        if (value === NaN || value === undefined || value === null) value = 0;
        this.setState({value});
        if (this.props.percent) value = value / 100.0;
        this.props.onChange(value);
    }

    title() {
        return this.props.title.split("_").map(word => (word[0]?.toUpperCase() ?? '') + word.substr(1)).join(' ');
    }

    render() {
        return (
            <div className="block">
            <div className="title">{this.title()}</div>
            <input type='number' className="number-input"  value={this.state.value} onChange={this.handleChange}></input>
            {(this.props.percent ? <span className="percent">%</span> : "")}
            </div>
        );
    }
}

type InputProps = { program: string, onValueChange: any };
class InputField extends React.Component<InputProps, any> {
    constructor(props: InputProps) {
        super(props);
        this.state = {value: ''};
        this.handleChange = this.handleChange.bind(this);
    }
    handleChange(event: any) {
        this.props.onValueChange(event.target.value);
    }
    render() {
        return (
            <textarea className="program-input" value={this.props.program} onChange={this.handleChange} />
        );
    }
}

type DisplayProps = { blocks: any[], overrides: any };
class Display extends React.Component<DisplayProps, any> {
    constructor(props: DisplayProps) {
        super(props);
    }

    render() {
        return (
            <div className="display">{this.props.blocks}</div>
        )
    }
}

function isNumeric(str: any) {
  if (typeof str != "string") return false // we only process strings!  
  return !isNaN(str as unknown as number) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
         !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
}

type State = { program: string, blocks: any[], overrides: any, layout: any[] };
class App extends React.Component<any, State> {
    constructor(props: any) {
        super(props);
        this.state = {program: '', blocks: [], overrides: {}, layout: []};
    }

    parse = (expr: string) => {
        expr = expr.replace(/([^\w_])?sin\(/g, (_, prefix) => prefix ?? "" + " Math.sin(");
        expr = expr.replace(/([^\w_])?cos\(/g, (_, prefix) => prefix ?? "" + " Math.cos(");
        expr = expr.replace(/([^\w_])?tan\(/g, (_, prefix) => prefix ?? "" + " Math.tan(");
        return expr;
    }

    eval = (values: any, thisLabel: string, expr: string, overrides?: any) => {
        if (expr == null || expr == undefined || expr.match(/^\s*$/)) return 0;
        try {
            let value = eval(this.parse(expr.replace(/\$\w+/g, (text: string) => {
                let label = text.substr(1);
                let value: number = 0;
                if (label != thisLabel) 
                    value = values[label];
                if (value === null || value === undefined) value = 0;
                if (overrides != undefined) {
                    let override = overrides[label];
                    if (override != null && override != undefined) {
                        console.log(`${label} override: ${override}`);
                        value = override.toString();
                    }
                }
                if (isNumeric(value.toString()))
                    return value.toString();
                else
                    return '0';
            })));
            if (isNumeric(value.toString()))
                return value.toString();
            else
                return '0';
        } catch (e) {
            console.log(e);
            return 0;
        }
    }

    freeLabels = (blocks: any, expr: string) => {
        return Array.from(expr.matchAll(/\$(?<label>[\w_]+)/g)).filter(match => blocks.filter((row: any) => row.filter((block: any) => block.label == match.groups?.label).length > 0).length == 0).map(match => match[0].substr(1));
    }

    renderBlocks = (text: string, overrides?: any) => {
        let blocks: any[] = [];
        let values: any = {};
        text.split('\n').forEach(line => {
            let row: any[] = [];
            line.split(';').forEach(segment => {
                segment = segment.trim();
                let match: any;
                if (match = segment.match(/(?<label>[\w_]+)\s*=\s*(?<expr>.+)/)) {
                    this.freeLabels(blocks, match.groups.expr).forEach(label => {
                        blocks.push([{label: label, mode: "input"}]);
                    });
                    values[match.groups.label] = this.eval(values, match.groups.label, match.groups.expr, overrides);
                    row.push({label: match.groups.label, mode: "value", value: values[match.groups.label]});
                } else if (match = segment.match(/^\$(?<label>[\w_]+)%?$/)) {
                    row.push({label: match.groups.label, mode: "input", percent: match[0].endsWith('%') });
                } else if (match = segment.match(/---/)) {
                    row.push({ mode: "separator" });
                } else if (match = segment.match(/^(?<count>#+)\s*(?<title>.+)$/)) {
                    row.push({ mode: "title", title: match.groups.title, count: match.groups.count.length });
                }
            });
            if (row.length > 0)
                blocks.push(row);
        });
        console.log(blocks);
        return { blocks };
    }


    onValueChange = (program: string) => {
        this.setState(state => { return {program, ...this.renderBlocks(program, state.overrides)} });
    }

    onInputChange = (label: string, value: number) => {
        let overrides = {...this.state.overrides};
        overrides[label] = value;
        this.setState(state => { return {overrides, ...this.renderBlocks(state.program, overrides)} });
    }

    makeRow = (row: any, i: number) => {
        let j: number = 0;
        console.log(row);
        return <div className='block-row' key={i}>{row.map((block: any) => this.makeBlock(block, j++))}</div>;
    }

    makeBlock = (block: any, i: number) => {
        switch (block.mode) {
            case "input":
                return <InputBlock key={block.label + i} title={block.label} percent={block.percent} onChange={(value: number) => this.onInputChange(block.label, value)} />
            case "value":
                return <ValueBlock key={block.label + i} value={block.value} title={block.label} />
            case "separator":
                return <div className="hsep" key={i}></div>;
            case "title":
                return <div className={"h" + Math.max(Math.min(block.count, 6), 1)} key={block.title + i}>{block.title}</div>;
        }
    }

    render = () => {
        console.log(this.state);
        let i = 0;
        return (
            <main className="app">
            <InputField program={this.state.program} onValueChange={this.onValueChange}/>
            <div className="sep"></div>
            <div className="display">{this.state.blocks.map((row: any) => this.makeRow(row, i++))}</div>
            </main>
        )
    }
}

export default App;
