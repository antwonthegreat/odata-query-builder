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
    .filter('HiMom');

    expect(query.toString()).to.equal('filter=HiMom');
  });

  it('should add count to querystring' , () => {
    const query = new ODataQuery<Post>()
    .count();

    expect(query.toString()).to.equal('count=true');
  });

});