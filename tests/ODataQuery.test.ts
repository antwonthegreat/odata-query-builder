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
    .expand('Author',o => o.select(['Name']).expand('Comments'));

    expect(query.toString()).to.equal('select=AuthorId,Id&expand=Author(select=Name;expand=Comments)');
  });

});