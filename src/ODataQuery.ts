type KeysMatching<T, V> = {
  [K in keyof T]-?: T[K] extends V ? K : never;
}[keyof T];
type SelectKey<T> = KeysMatching<
  T,
  string | number | null | boolean | undefined | object
>;
type ExpandKey<T> = KeysMatching<T, object | null | undefined>;
type ExpandManyKey<T> = KeysMatching<T, Array<object | null | undefined>>;
type Unarray<T> = T extends Array<infer U> ? U : T;

type SimpleFilterExpression<T> =
  | `${Extract<KeysMatching<T, boolean | null | undefined>, string>}` //boolean
  | `${Extract<KeysMatching<T, string | null | undefined>, string>} ${
      | "eq"
      | "ne"} ${`'${string}'` | "null"}` // string
  | `${Extract<KeysMatching<T, boolean | null | undefined>, string>} eq ${
      | "true"
      | "false"}` //eq bool
  | `${Extract<KeysMatching<T, number | null | undefined>, string>} ${
      | "eq"
      | "ne"
      | "lt"
      | "le"
      | "gt"
      | "ge"} ${number}` // number
  | `isof('${string}')`; //isof

// type DeepFilterExpression<T> = `${Extract<
//   ExpandKey<T>,
//   string
// >}/${SimpleFilterExpression<ExpandKey<T>>}`;

// type DeepFilterExpression<
//   T,
//   ExpandedPropertyType extends ExpandKey<T>
// > = `${Extract<ExpandKey<T>, string>}/${SimpleFilterExpression<SelectKey<T>>}`;

// type BoolFilterProperty<T> = Extract<
//   KeysMatching<T, boolean | null | undefined>,
//   string
// >;
// type StringFilterProperty<T> = Extract<
//   KeysMatching<T, string | null | undefined>,
//   string
// >;
// type NumberFilterProperty<T> = Extract<
//   KeysMatching<T, number | null | undefined>,
//   string
// >;
// type DeepFilterProperty<
//   T,
//   ExpandedPropertyType extends KeysMatching<T, string>
// > = ExpandedPropertyType extends ""
//   ? never
//   : `${Extract<ExpandKey<T>, string>}/${Extract<ExpandedPropertyType, string>}`;

// type DeepFilterExpression<
//   T,
//   ExpandedPropertyType extends ExpandKey<T>
// > = `${Extract<ExpandKey<T>, string>}/${Extract<ExpandedPropertyType, string>}`;

// type SimpleOrDeepFilterExpression<T> =
//   | SimpleFilterExpression<T>
//   | DeepFilterExpression<T, ExpandKey<T>>;

type SimpleOrDeepFilterExpression<T> = SimpleFilterExpression<T>;
// | DeepFilterProperty<T, KeysMatching<T, any>>

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I
) => void
  ? I
  : never;
type UnionToOvlds<U> = UnionToIntersection<
  U extends any ? (f: U) => void : never
>;

type PopUnion<U> = UnionToOvlds<U> extends (a: infer A) => void ? A : never;

type UnionConcat<
  U extends string | number | symbol,
  Sep extends string
> = PopUnion<U> extends infer SELF
  ? SELF extends string
    ? Exclude<U, SELF> extends never
      ? SELF
      :
          | `${UnionConcat<Exclude<U, SELF>, Sep>}${Sep}${SELF}`
          | UnionConcat<Exclude<U, SELF>, Sep>
          | SELF
    : never
  : never;

type FilterExpression<T> =
  | SimpleOrDeepFilterExpression<T>
  | `${"" | " "}${SimpleOrDeepFilterExpression<T>}${"" | " "}` //allow spaces
  | `(${SimpleOrDeepFilterExpression<T>})` //balanced parentheses
  | `not ${SimpleOrDeepFilterExpression<T>}` //not
  | `${SimpleOrDeepFilterExpression<T>} and ${SimpleOrDeepFilterExpression<T>}` //and
  //| `${UnionConcat<SimpleOrDeepFilterExpression<T>, " and ">}`
  | `${SimpleOrDeepFilterExpression<T>} or ${SimpleOrDeepFilterExpression<T>}`; //or

export class ODataQuery<T extends object> {
  innerQuery: boolean = false;
  parts: {
    select?: SelectKey<T>[];
    expand?: Array<{
      prop: ExpandKey<T> | ExpandManyKey<T>;
      oData?: ODataQuery<Required<T[ExpandKey<T> | ExpandManyKey<T>]>>;
    }>;
    top?: number;
    skip?: number;
    filter?: Array<string | FilterExpression<T>>;
    count?: boolean;
    orderBy?: Array<{ prop: SelectKey<T>; direction?: "asc" | "desc" }>;
    compute?: string;
    rawQueryParts?: Array<string>;
  } = {};

  public toString = (): string => {
    return [
      this.parts.select ? `select=${this.parts.select.join(",")}` : "",
      ``,
      this.parts.expand
        ? `expand=${this.parts.expand
            .map((o) =>
              o.oData ? `${o.prop.toString()}(${o.oData.toString()})` : o.prop
            )
            .join(",")}`
        : "",
      this.parts.top !== undefined ? `top=${this.parts.top}` : "",
      this.parts.skip !== undefined ? `skip=${this.parts.skip}` : "",
      this.parts.filter
        ? `filter=${
            this.parts.filter.length > 1 ? "(" : ""
          }${this.parts.filter.join(") and (")}${
            this.parts.filter.length > 1 ? ")" : ""
          }`
        : "",
      this.parts.count ? "count=true" : "",
      this.parts.orderBy
        ? `orderBy=${this.parts.orderBy
            .map(
              (o) =>
                `${o.prop.toString()}${o.direction ? ` ${o.direction}` : ""}`
            )
            .join(",")}`
        : "",
      this.parts.compute ? `compute=${this.parts.compute}` : "",
      this.parts.rawQueryParts?.join(this.innerQuery ? ";" : "&"),
    ]
      .filter((o) => o)
      .join(this.innerQuery ? ";" : "&");
  };

  public select = (properties: SelectKey<T>[]) => {
    this.parts.select = properties;
    return this;
  };

  public selectString = (properties: UnionConcat<SelectKey<T>, ", ">) => {
    this.parts.select = (properties as string)
      .replace(" ", "")
      .split(",") as SelectKey<T>[];
    return this;
  };

  public rawQuery = (query: string) => {
    this.parts.rawQueryParts = [...(this.parts.rawQueryParts ?? []), query];
    return this;
  };

  public count = (count: boolean = true) => {
    this.parts.count = count;
    return this;
  };

  public orderBy = (propertyName: SelectKey<T>, direction?: "asc" | "desc") => {
    this.parts.orderBy = [
      ...(this.parts.orderBy ?? []),
      { prop: propertyName, direction },
    ];
    return this;
  };

  public filter = (filter: FilterExpression<T>) => {
    this.parts.filter = [...(this.parts.filter ?? []), filter];
    return this;
  };

  // public test = (filter: DeepFilterProperty<T, KeysMatching<T, any>>) => {
  //   this.parts.filter = [...(this.parts.filter ?? []), filter];
  //   return this;
  // };

  public rawFilter = (filter: string) => {
    this.parts.filter = [...(this.parts.filter ?? []), filter];
    return this;
  };

  public expand = <
    ExpandedPropertyType extends ExpandKey<T> | ExpandManyKey<T>,
    InnerQueryType extends ODataQuery<
      Required<Exclude<Unarray<T[ExpandedPropertyType]>, null | undefined>>
    >
  >(
    propertyName: ExpandedPropertyType,
    innerODataQuery?: (o: InnerQueryType) => InnerQueryType
  ) => {
    let innerOdata: InnerQueryType | null = null;
    if (innerODataQuery) {
      innerOdata = innerODataQuery(
        new ODataQuery<
          Required<Exclude<Unarray<T[ExpandedPropertyType]>, null | undefined>>
        >() as InnerQueryType
      );
      innerOdata.innerQuery = true;
    }
    this.parts.expand = [
      ...(this.parts.expand ?? []),
      { prop: propertyName, oData: innerOdata as any },
    ];
    return this;
  };

  public top = (top: number) => {
    this.parts.top = top;
    return this;
  };

  public skip = (skip: number) => {
    this.parts.skip = skip;
    return this;
  };

  //   public getType = () => {
  //     //return getdType({} as T, this.parts.select ?? []);
  //     return getF<T>()(this.parts.select);
  //   };
  // }

  // export function getF<T>(): <K extends (keyof T)[]>(
  //   keys: K
  // ) => Pick<T, ElementType<K>> {
  //   return (keys) => {
  //     {
  //     }
  //   };
  // }

  // type ElementType<T extends ReadonlyArray<unknown>> = T extends ReadonlyArray<
  //   infer ElementType
  // >
  //   ? ElementType
  //   : never;

  // export function getdType<T, K extends (keyof T)[]>(
  //   v: T,
  //   keys: K
  // ): Pick<T, ElementType<K>> {
  //   return v;
}
