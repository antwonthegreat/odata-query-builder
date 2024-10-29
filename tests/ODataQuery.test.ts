import { ODataQuery } from "../src/index";

import * as chai from "chai";
import { Post } from "./models";

const expect = chai.expect;
describe("ODataQuery", () => {
  it("should add only selected properties to select string", () => {
    const query = new ODataQuery<Post>().select(["AuthorId", "Id"]);
    expect(query.toString()).to.equal("select=AuthorId,Id");
  });
  it("should allow selecting nullable and undefined properties", () => {
    new ODataQuery<Post>()
      .select(["Message"])
      .select(["NullableMessage"])
      .select(["UndefinedMessage"]);
  });
  it("should allow selecting complex properties", () => {
    new ODataQuery<Post>().select(["Author"]);
  });
  it("should use '&' to separate parts of outer query and ';' to separate parts of inner query", () => {
    const query = new ODataQuery<Post>()
      .select(["AuthorId", "Id"])
      .expand("Author", (o) =>
        o.select(["Name"]).expand("Comments", (c) => c.select(["PostId"]))
      )
      .expand("Comments", (o) => o.select(["PostId"]));
    expect(query.toString()).to.equal(
      "select=AuthorId,Id&expand=Author(select=Name;expand=Comments(select=PostId)),Comments(select=PostId)"
    );
  });
  it("should add raw filter string without modification", () => {
    const query = new ODataQuery<Post>().rawFilter("HiMom");
    expect(query.toString()).to.equal("filter=HiMom");
  });
  it("should add count to querystring", () => {
    const query = new ODataQuery<Post>().count();
    expect(query.toString()).to.equal("count=true");
  });
  it("should add orderbys to querystring", () => {
    const query = new ODataQuery<Post>()
      .orderBy("Message", "asc")
      .orderBy("Id")
      .orderBy("AuthorId", "desc");
    expect(query.toString()).to.equal("orderBy=Message asc,Id,AuthorId desc");
  });
  it("filtering on a non existent property should be a compile error", () => {
    new ODataQuery<Post>()
      // @ts-expect-error
      .filter("IsPblished");
  });
  it("selecting a non existent property should be a compile error", () => {
    new ODataQuery<Post>()
      // @ts-expect-error
      .select("IsPblished");
  });
  it("should not allow expanding to primitive objects", () => {
    new ODataQuery<Post>()
      // @ts-expect-error
      .expand("Note");
  });
  it("should allow expanding to nullable and undefined objects", () => {
    new ODataQuery<Post>()
      .expand("NullableAuthor", (o) =>
        o.select(["Name"]).expand("Comments", (c) => c.select(["PostId"]))
      )
      .expand("Author", (o) =>
        o.select(["Name"]).expand("Comments", (c) => c.select(["PostId"]))
      )
      .expand("UndefinedAuthor", (o) =>
        o.select(["Name"]).expand("Comments", (c) => c.select(["PostId"]))
      );
  });
  it("expanding to a primitive property should be a compile error", () => {
    new ODataQuery<Post>()
      // @ts-expect-error
      .expand("IsPublished");
  });
  it("filter allows whitespace", () => {
    const query = new ODataQuery<Post>().filter(" IsPublished ");
    expect(query.toString()).to.equal("filter= IsPublished ");
  });
  it("should allow filtering on nullable and undefined properties", () => {
    new ODataQuery<Post>()
      .filter(" NullableMessage eq 'Hi' ")
      .filter(" Message eq 'Hi' ")
      .filter(" UndefinedMessage eq 'Hi' ")
      .filter(" NullableMessage eq null ")
      .filter(" Message eq null ")
      .filter(" UndefinedMessage eq null");
  });

  // it("should allow filtering on complex objects", () => {
  //   new ODataQuery<Comment>()
  //     .test("Post/Author/IsVerified")
  //     // @ts-expect-error
  //     .test("Post/")
  //     // @ts-expect-error
  //     .test("Porst/Author/IsVerified")
  //     // @ts-expect-error
  //     .test("Post/Author/IsVerifiesd")
  //     // @ts-expect-error
  //     .test("Post/Autdhor/IsVerified")
  //     .test("Author/Name")
  //     // @ts-expect-error
  //     .test("Author/asdasd")
  //     .test("Post/NullableMessage")
  //     .test("Post/Message eq 'Alice' ")
  //     .test(" Post/NullableAuthor eq null ")
  //     .test(" Post/UndefinedAuthor eq null");
  // });

  it("should enforce filter rules", () => {
    new ODataQuery<Post>()
      .filter("IsPublished") //bool
      .filter("Message eq 'Welcome'") //string compare
      .filter("IsPublished eq true") //explicit bool equality
      .filter("isof('Namespace.Type')") //isof expression
      .filter("Id eq 4") //number compare
      .filter(" Id eq 4 ") //some whitespace allowed
      .filter("(Id eq 4)") //balanced parentheses allowed
      .filter("not Message eq 'Welcome'") //not expression
      .filter("Message eq 'Welcome' and Id eq 3") //and expression
      .filter("Message eq 'Welcome' or Id eq 3") //or expression
      // @ts-expect-error
      .filter("Id eq 'Welcome'") //string compare
      // @ts-expect-error
      .filter("Message eq true") //explicit bool equality
      // @ts-expect-error
      .filter("Message eq 4") //number compare
      // @ts-expect-error
      .filter("    Id eq 4 ") //some whitespace allowed
      // @ts-expect-error
      .filter("Id eq 4)") //balanced parentheses allowed
      // @ts-expect-error
      .filter("not Message'") //not expression
      // @ts-expect-error
      .filter("Message eq 'Welcome' and ") //and expression
      // @ts-expect-error
      .filter("Message eq 'Welcome' or ") //or expression
      // @ts-expect-error
      .filter("Messaged eq 'Welcome'"); //invalid property
  });
  it("multiple filters combined with parentheses", () => {
    const query = new ODataQuery<Post>()
      .filter("IsPublished")
      .filter("Message eq 'Welcome'");
    expect(query.toString()).to.equal(
      "filter=(IsPublished) and (Message eq 'Welcome')"
    );
  });
  it("raw query parts should be combined with typed parts", () => {
    const query = new ODataQuery<Post>()
      .expand("Author", (o) =>
        o.select(["Name"]).rawQuery("count=1").rawQuery("top=2")
      )
      .filter(" IsPublished")
      .rawQuery("top=1");
    expect(query.toString()).to.equal(
      "expand=Author(select=Name;count=1;top=2)&filter= IsPublished&top=1"
    );
  });

  // it("pick", () => {
  //   const a = new ODataQuery<Pick<Post, "Author" | "IsPublished">>()
  //     .select(["Author"])
  //     .select(["NullableMessage"])
  //     .select(["UndefinedMessage"])
  //     .getType();
  // });
});
