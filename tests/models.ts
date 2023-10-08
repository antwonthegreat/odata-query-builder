export interface Forum {
    Id: number;
    Name: string,
    Description: string|null;
}

export interface User {
    Id: number;
    Name: string;
    Posts: Array<Post>;
    Comments: Array<Partial<Comment>>;
}

export interface Post {
    Id: number;
    Message: string;
    Author: Partial<User>;
    AuthorId: number;
    Comments: Array<Partial<Comment>>;
}

export interface Comment {
    Id: number;
    Message: string;
    Author: User;
    AuthorId: number;
    Post: Post;
    PostId: number;
}