type KeysMatching<T, V> = {[K in keyof T]-?: T[K] extends V ? K : never}[keyof T];
type SelectKey<T> = KeysMatching<T,string|number>;
type ExpandKey<T> = KeysMatching<T,object>;
type ExpandManyKey<T> = KeysMatching<T,Array<object>>;
type Unarray<T> = T extends Array<infer U> ? U : T;

export class ODataQuery<Tobj>{

    innerQuery:boolean = false;
    parts:{
        select?:SelectKey<Tobj>[],
        expand?:Array<{prop:ExpandKey<Tobj>|ExpandManyKey<Tobj>,oData?: ODataQuery<Required<Tobj[ExpandKey<Tobj>|ExpandManyKey<Tobj>]>>}>,
        top?:number,
        skip?:number
    } = {};

    public toString = (): string => {
        return [
            `${this.parts.select ? `select=${this.parts.select.join(',')}`  : ''}`,
            `${this.parts.expand ? 
                `expand=${this.parts.expand.map(o => o.oData ? `${o.prop.toString()}(${o.oData.toString()})` : o.prop).join(',')}`  
                : ''}`,
            `${this.parts.top ? `top=${this.parts.top}`  : ''}`,
            `${this.parts.skip ? `skip=${this.parts.skip}`  : ''}`
        ].filter(o => o).join(this.innerQuery?  ';' :'&');
    }

    public select = (properties:(SelectKey<Tobj>)[]) => {
        this.parts.select = properties;
        return this;
    }

    public expand = <
        CollectionName extends ExpandKey<Tobj> 
    >(prop:CollectionName, innerOdataSelect?:(o:ODataQuery<Tobj[CollectionName]>)=>ODataQuery<Tobj[CollectionName]>)   => {
        let innerOdata:ODataQuery<Tobj[CollectionName]>|null = null;
        if(innerOdataSelect){
            innerOdata = innerOdataSelect(new ODataQuery<Tobj[CollectionName]>);
            innerOdata.innerQuery = true;
        }
        this.parts.expand = [...this.parts.expand ?? [],{prop, oData:innerOdata as any}];
        return this;
    }

    public expandMany = <
        CollectionName extends ExpandManyKey<Tobj> 
    >(prop:CollectionName, innerOdataSelect?:(o:ODataQuery<Unarray<Tobj[CollectionName]>>)=>ODataQuery<Unarray<Tobj[CollectionName]>>)   => {
        let innerOdata:ODataQuery<Unarray<Tobj[CollectionName]>>|null = null;
        if(innerOdataSelect){
            innerOdata = innerOdataSelect(new ODataQuery<Unarray<Tobj[CollectionName]>>);
            innerOdata.innerQuery = true;
        }
        this.parts.expand = [...this.parts.expand ?? [],{prop, oData:innerOdata as any}];
        return this;
    }

    public top = (top:number) => {
        this.parts.top = top;
        return this;
    }

    public skip = (skip:number) => {
        this.parts.skip = skip;
        return this;
    }
}