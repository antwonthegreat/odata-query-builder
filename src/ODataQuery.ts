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
        ExpandedPropertyType extends ExpandKey<Tobj>|ExpandManyKey<Tobj>,
        InnerQueryType extends ODataQuery<Required<Unarray<Tobj[ExpandedPropertyType]>>>
    >(propertyName:ExpandedPropertyType, innerODataQuery?:(o:InnerQueryType)=>InnerQueryType) => {
        let innerOdata:InnerQueryType|null = null;
        if(innerODataQuery){
            innerOdata = innerODataQuery(new ODataQuery<Required<Unarray<Tobj[ExpandedPropertyType]>>> as InnerQueryType);
            innerOdata.innerQuery = true;
        }
        this.parts.expand = [...this.parts.expand ?? [],{prop: propertyName, oData:innerOdata as any}];
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