type KeysMatching<T, V> = {[K in keyof T]-?: T[K] extends V ? K : never}[keyof T];
type SelectKey<T> = KeysMatching<T,string|number>;
type ExpandKey<T> = KeysMatching<T,object>;
type ExpandManyKey<T> = KeysMatching<T,Array<object>>;
type Unarray<T> = T extends Array<infer U> ? U : T;

type SimpleFilterExpression<T> = 
 `${Extract<KeysMatching<T, boolean>,string>}`| //boolean
 `${Extract<KeysMatching<T, string>,string>} ${'eq'|'ne'} '${string}'`|// string
 `${Extract<KeysMatching<T, boolean>,string>} eq ${'true'|'false'}`|//eq bool
 `${Extract<KeysMatching<T, number>,string>} ${'eq'|'ne'|'lt'|'le'|'gt'|'ge'} ${number}`// number
  ;

type ExtractedSimpleFilterExpression<T> = Extract<SimpleFilterExpression<T>,string>;

type FilterExpression<T> = 
ExtractedSimpleFilterExpression<T> |
  `${''|' '}${ExtractedSimpleFilterExpression<T>}${''|' '}` |//allow spaces
  `(${ExtractedSimpleFilterExpression<T>})` |//balanced parentheses 
  `not ${ExtractedSimpleFilterExpression<T>}` |//not
  `${ExtractedSimpleFilterExpression<T>} and ${ExtractedSimpleFilterExpression<T>}` |//and
  `${ExtractedSimpleFilterExpression<T>} or ${ExtractedSimpleFilterExpression<T>}`  //or
  ;

export class ODataQuery<T>{

    innerQuery:boolean = false;
    parts:{
        select?:SelectKey<T>[],
        expand?:Array<{prop:ExpandKey<T>|ExpandManyKey<T>,oData?: ODataQuery<Required<T[ExpandKey<T>|ExpandManyKey<T>]>>}>,
        top?:number,
        skip?:number,
        filter?:Array<string|FilterExpression<T>>,
        count?:boolean
    } = {};

    public toString = (): string => {
        return [
            this.parts.select ? `select=${this.parts.select.join(',')}`  : '',
            ``,
            this.parts.expand ? 
                `expand=${this.parts.expand.map(o => o.oData ? `${o.prop.toString()}(${o.oData.toString()})` : o.prop).join(',')}`  
                : '',
            this.parts.top ? `top=${this.parts.top}`  : '',
            this.parts.skip ? `skip=${this.parts.skip}`  : '',
            this.parts.filter ? `filter=${this.parts.filter.join(' and ')}` : '',
            this.parts.count ? 'count=true' :'',
        ].filter(o => o).join(this.innerQuery?  ';' :'&');
    }

    public select = (properties:(SelectKey<T>)[]) => {
        this.parts.select = properties;
        return this;
    }

    public count = (count:boolean = true) => {
        this.parts.count = count;
        return this;
    }


    public filter = (filter:FilterExpression<T>) => {
        this.parts.filter = [...this.parts.filter ?? [], filter];
        return this;
    }

    public rawFilter = (filter:string) => {
        this.parts.filter = [...this.parts.filter ?? [], filter];
        return this;
    }

    public expand = <
        ExpandedPropertyType extends ExpandKey<T>|ExpandManyKey<T>,
        InnerQueryType extends ODataQuery<Required<Unarray<T[ExpandedPropertyType]>>>
    >(propertyName:ExpandedPropertyType, innerODataQuery?:(o:InnerQueryType)=>InnerQueryType) => {
        let innerOdata:InnerQueryType|null = null;
        if(innerODataQuery){
            innerOdata = innerODataQuery(new ODataQuery<Required<Unarray<T[ExpandedPropertyType]>>> as InnerQueryType);
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