export interface Forum {
    Id: number;
    Name: string,
    Description: string|null;
}

export interface User {
    Id: number;
    Name: string;
    Posts: Array<Post>;
    Comments: Array<Comment>;
}

export interface Post {
    Id: number;
    Message: string;
    Author: User;
    AuthorId: number;
    Comments: Array<Comment>;
}

export interface Comment {
    Id: number;
    Message: string;
    Author: User;
    AuthorId: number;
    Comment: Comment;
    COmmentId: number;
}