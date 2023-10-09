type KeysMatching<T, V> = {[K in keyof T]-?: T[K] extends V ? K : never}[keyof T];
type SelectKey<T> = KeysMatching<T,string|number|null|undefined>;
type ExpandKey<T> = KeysMatching<T,object|null|undefined>;
type ExpandManyKey<T> = KeysMatching<T,Array<object|null|undefined>>;
type Unarray<T> = T extends Array<infer U> ? U : T;

type SimpleFilterExpression<T> = 
 `${Extract<KeysMatching<T, boolean|null|undefined>,string>}`| //boolean
 `${Extract<KeysMatching<T, string|null|undefined>,string>} ${'eq'|'ne'} '${string}'`|// string
 `${Extract<KeysMatching<T, boolean|null|undefined>,string>} eq ${'true'|'false'}`|//eq bool
 `${Extract<KeysMatching<T, number|null|undefined>,string>} ${'eq'|'ne'|'lt'|'le'|'gt'|'ge'} ${number}`// number
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
        count?:boolean,
        orderBy?:Array<{prop:SelectKey<T>,direction?:'asc'|'desc'}>,
        rawQueryParts?:Array<string>
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
            this.parts.filter ? `filter=${this.parts.filter.length > 1 ? '(' : ''}${this.parts.filter.join(') and (')}${this.parts.filter.length > 1 ? ')' : ''}` : '',
            this.parts.count ? 'count=true' :'',
            this.parts.orderBy ? 
                `orderBy=${this.parts.orderBy.map(o => `${o.prop.toString()}${o.direction ? ` ${o.direction}` : ''}`).join(',')}`  
                : '',
            this.parts.rawQueryParts?.join(this.innerQuery?  ';' :'&')
        ].filter(o => o).join(this.innerQuery?  ';' :'&');
    }

    public select = (properties:(SelectKey<T>)[]) => {
        this.parts.select = properties;
        return this;
    }

    public rawQuery = (query:string) => {
        this.parts.rawQueryParts = [...this.parts.rawQueryParts ?? [],query];
        return this;
    }

    public count = (count:boolean = true) => {
        this.parts.count = count;
        return this;
    }

    public orderBy = (propertyName:SelectKey<T>, direction?:'asc'|'desc') => {        
        this.parts.orderBy = [...this.parts.orderBy ?? [],{prop: propertyName, direction}];
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
        InnerQueryType extends ODataQuery<Required<Exclude<Unarray<T[ExpandedPropertyType]>,null|undefined>>>
    >(propertyName:ExpandedPropertyType, innerODataQuery?:(o:InnerQueryType)=>InnerQueryType) => {
        let innerOdata:InnerQueryType|null = null;
        if(innerODataQuery){
            innerOdata = innerODataQuery(new ODataQuery<Required<Exclude<Unarray<T[ExpandedPropertyType]>, null|undefined>>> as InnerQueryType);
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