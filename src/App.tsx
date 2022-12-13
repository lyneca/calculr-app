import * as React from 'react';

type ValueBlockProps = { title: string, value: number, type: InputType };
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
            <div className="result"><span className="prefix">{this.props.type == InputType.CURRENCY ? "$" : ""}</span>{Math.round(this.props.value * 100) / 100 * (this.props.type == InputType.PERCENT ? 100 : 1)}<span className="suffix">{(this.props.type == InputType.PERCENT ? "%" : "")}</span></div>
            </div>
        );
    }
}

enum InputType {
    DEFAULT,
    PERCENT,
    CURRENCY
}

type InputBlockProps = { title: string, onChange: any, type: InputType };
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
        if (Number.isNaN(value) || value === undefined || value === null) value = 0;
        this.setState({value});
        this.props.onChange(value);
    }

    title() {
        return this.props.title.split("_").map(word => (word[0]?.toUpperCase() ?? '') + word.substr(1)).join(' ');
    }

    render() {
        return (
            <div className="block">
            <div className="title">{this.title()}</div>
            {(this.props.type == InputType.CURRENCY ? <span className="currency">$</span> : "")}
            <input type='number' className="number-input" value={this.state.value} onChange={this.handleChange}></input>
            {(this.props.type == InputType.PERCENT ? <span className="percent">%</span> : "")}
            </div>
        );
    }
}

const example = `# Math Stuff

---

### Quadratic Equation

$a ; $b ; $c

x_1 = (-$b + sqrt(pow($b, 2) - 4 * $a * $c)) / 2 * $a ; x_2 = (-$b - sqrt(pow($b, 2) - 4 * $a * $c)) / 2 * $a

---

### Compound Interest
$principal$ ; $rate% ; $frequency

$years ; total_accumulated$ = $principal * pow(1 + $rate / $frequency, $frequency * $years)`

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
            <textarea placeholder={example} className="program-input" value={this.props.program} onChange={this.handleChange} />
        );
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
        expr = expr.replace(/(Math\.)?floor\(/g, "Math.floor(");
        expr = expr.replace(/(Math\.)?ceil\(/g, "Math.ceil(");
        expr = expr.replace(/(Math\.)?round\(/g, "Math.round(");
        expr = expr.replace(/(Math\.)?sin\(/g, "Math.sin(");
        expr = expr.replace(/(Math\.)?cos\(/g, "Math.cos(");
        expr = expr.replace(/(Math\.)?tan\(/g, "Math.tan(");
        expr = expr.replace(/(Math\.)?sqrt\(/g, "Math.sqrt(");
        expr = expr.replace(/(Math\.)?pow\(/g, "Math.pow(");
        return expr;
    }

    eval = (values: any, thisLabel: string, expr: string, overrides?: any) => {
        if (expr == null || expr == undefined || expr.match(/^\s*$/)) return 0;
        let string = this.parse(expr.replace(/\$\w+/g, (text: string) => {
                let label = text.substr(1);
                let value: number = 0;
                if (label != thisLabel) 
                    value = values[label];
                if (value === null || value === undefined) value = 0;
                if (overrides != undefined) {
                    let override = overrides[label];
                    if (override != null && override != undefined) {
                        value = override.toString();
                    }
                }
                if (isNumeric(value.toString()))
                    return value.toString();
                else
                    return '0';
            }));
        console.log(`Evaluating ${string}`)
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

    freeLabels = (blocks: any, row: any, expr: string) => {
        console.log(expr)
        console.log(Array.from(blocks))
        return Array.from(new Set<any>(Array.from(expr.matchAll(/\$(?<label>[\w_]+)/g))
            .filter(match => [row, ...blocks]
                .filter((row: any) => row
                    .filter((block: any) => block.label == match.groups?.label)
                    .length > 0)
                .length == 0)
            .map(match => match[0].substr(1))));
    }

    detectInputType = (label: string) => {
        if (label === undefined) return InputType.DEFAULT;
        switch (label[label.length - 1]) {
            case '%': return InputType.PERCENT;
            case '$': return InputType.CURRENCY;
            default: return InputType.DEFAULT;
        }
    }

    renderBlocks = (text: string, overrides?: any) => {
        let blocks: any[] = [];
        let values: any = {};
        let newOverrides: any = {};
        text.split('\n').forEach(line => {
            let row: any[] = [];
            line.split(';').forEach(segment => {
                segment = segment.trim();
                let match: any;
                if (match = segment.match(/(?<label>[\w_]+)(?<type>[%$])?\s*=\s*(?<expr>.+)/)) {
                    this.freeLabels(blocks, row, match.groups.expr).forEach(label => {
                        blocks.push([{label: label, mode: "input"}]);
                        if (overrides.hasOwnProperty(label)) newOverrides[label] = overrides[label];
                        else newOverrides[label] = 0;
                    });
                    values[match.groups.label] = this.eval(values, match.groups.label, match.groups.expr, {...overrides, ...newOverrides});
                    row.push({label: match.groups.label, mode: "value", value: values[match.groups.label], type: this.detectInputType(match.groups.type)});
                } else if (match = segment.match(/^\$(?<label>[\w_]+)[%$]?$/)) {
                    row.push({
                        label: match.groups.label,
                        mode: "input",
                        type: this.detectInputType(match[0])
                    });
                    if (overrides.hasOwnProperty(match.groups.label)) newOverrides[match.groups.label] = overrides[match.groups.label];
                    else newOverrides[match.groups.label] = 0;
                } else if (match = segment.match(/---/)) {
                    row.push({ mode: "separator" });
                } else if (match = segment.match(/^(?<count>#+)\s*(?<title>.+)$/)) {
                    row.push({ mode: "title", title: match.groups.title, count: match.groups.count.length });
                }
            });
            if (row.length > 0)
                blocks.push(row);
        });
        return { blocks, overrides: newOverrides };
    }


    onValueChange = (program: string) => {
        this.setState(state => { return {program, ...this.renderBlocks(program, state.overrides)} });
    }

    onInputChange = (label: string, value: number, type: InputType) => {
        let overrides = {...this.state.overrides};
        overrides[label] = value / (type == InputType.PERCENT ? 100 : 1);
        this.setState(state => { return {...this.renderBlocks(state.program, overrides)} });
    }

    makeRow = (row: any, i: number) => {
        let j: number = 0;
        return <div className='block-row' key={i}>{row.map((block: any) => this.makeBlock(block, j++))}</div>;
    }

    makeBlock = (block: any, i: number) => {
        switch (block.mode) {
            case "input":
                return <InputBlock key={block.label + i} title={block.label} type={block.type} onChange={(value: number) => this.onInputChange(block.label, value, block.type)} />
            case "value":
                return <ValueBlock key={block.label + i} value={block.value} title={block.label} type={block.type} />
            case "separator":
                return <div className="hsep" key={i}></div>;
            case "title":
                return <div className={"h" + Math.max(Math.min(block.count, 6), 1)} key={block.title + i}>{block.title}</div>;
        }
    }

    render = () => {
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

/*
# How Many to Sell?
---
$base_price$;$discount%;sell_price$=$base_price/(1-$discount)
$trader_money$;sell_amount=floor($trader_money/$sell_price)
*/

export default App;
