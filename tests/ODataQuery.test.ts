import {ODataQuery} from '../src/index';

// import * as mocha from 'mocha';
import * as chai from 'chai';
import { Post } from './models';

const expect = chai.expect;
describe('ODataQuery', () => {

  it('should add only selected properties to select string' , () => {
    const query = new ODataQuery<Post>()
    .select(['AuthorId','Id']);

    expect(query.toString()).to.equal('select=AuthorId,Id');
  });

  it("should use '&' to separate parts of outer query and ';' to separate parts of inner query" , () => {
    const query = new ODataQuery<Post>()
    .select(['AuthorId','Id'])
    .expand('Author',o => o.select(['Name']).expand('Comments',c=>c.select(['PostId'])))
    .expand('Comments',o => o.select(['PostId']))
    ;

    expect(query.toString()).to.equal('select=AuthorId,Id&expand=Author(select=Name;expand=Comments(select=PostId)),Comments(select=PostId)');
  });

  it('should add raw filter string without modification' , () => {
    const query = new ODataQuery<Post>()
    .rawFilter('HiMom');

    expect(query.toString()).to.equal('filter=HiMom');
  });

  it('should add count to querystring' , () => {
    const query = new ODataQuery<Post>()
    .count();

    expect(query.toString()).to.equal('count=true');
  });

  it('should add orderbys to querystring' , () => {
    const query = new ODataQuery<Post>()
    .orderBy('Message','asc')
    .orderBy('Id')
    .orderBy('AuthorId','desc');

    expect(query.toString()).to.equal('orderBy=Message asc,Id,AuthorId desc');
  });

  it('filtering on a non existent property should be a compile error' , () => {
    new ODataQuery<Post>()
    // @ts-expect-error
    .filter('IsPblished');
  });

  it('selecting a non existent property should be a compile error' , () => {
    new ODataQuery<Post>()
    // @ts-expect-error
    .select('IsPblished');
  });

  it('expanding to a primitive property should be a compile error' , () => {
    new ODataQuery<Post>()
    // @ts-expect-error
    .expand('IsPublished');
  });

  it('filter allows whitespace' , () => {
    const query = new ODataQuery<Post>()
    .filter(' IsPublished ')
    ;

    expect(query.toString()).to.equal('filter= IsPublished ');
  });

  it('should enforce filter rules' , () => {
    new ODataQuery<Post>()
    .filter('IsPublished')//bool
    .filter("Message eq 'Welcome'")//string compare
    .filter("IsPublished eq true")//explicit bool equality
    .filter("Id eq 4")//number compare
    .filter(" Id eq 4 ")//some whitespace allowed 
    .filter('(Id eq 4)')//balanced parentheses allowed
    .filter("not Message eq 'Welcome'")//not expression
    .filter("Message eq 'Welcome' and Id eq 3")//and expression
    .filter("Message eq 'Welcome' or Id eq 3")//or expression

    // @ts-expect-error
    .filter('Message')//bool
    // @ts-expect-error
    .filter("Id eq 'Welcome'")//string compare
    // @ts-expect-error
    .filter("Message eq true")//explicit bool equality
    // @ts-expect-error
    .filter("Message eq 4")//number compare
    // @ts-expect-error
    .filter("    Id eq 4 ")//some whitespace allowed 
    // @ts-expect-error
    .filter('Id eq 4)')//balanced parentheses allowed
    // @ts-expect-error
    .filter("not Message'")//not expression
    // @ts-expect-error
    .filter("Message eq 'Welcome' and ")//and expression
    // @ts-expect-error
    .filter("Message eq 'Welcome' or ")//or expression
    ;
  });

  it('multiple filters combined with parentheses' , () => {
    const query = new ODataQuery<Post>()
    .filter('IsPublished')
    .filter("Message eq 'Welcome'")
    ;

    expect(query.toString()).to.equal("filter=(IsPublished) and (Message eq 'Welcome')");
  });

  it('raw query parts should be combined with typed parts' , () => {
    const query = new ODataQuery<Post>()
    .expand('Author', o => o.select(['Name']).rawQuery('count=1').rawQuery('top=2'))
    .filter(' IsPublished')
    .rawQuery('top=1')
    ;

    expect(query.toString()).to.equal('expand=Author(select=Name;count=1;top=2)&filter= IsPublished&top=1');
  });

});