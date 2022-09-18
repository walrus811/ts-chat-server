export default interface HttpResponseBody<T>
{
  data: T;
}

export interface UserResponseBody
{
  id: string;
  name: string;
  joinedDateTime: Date;
}