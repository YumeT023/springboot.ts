# Spring boot TS

Well, i'm out of my mind, ... yet another Meta backend framework built using Typescript...
This is a demo on how to use Typescript **experimental decorators** to create something Metaprogramming thing

as i'm friendly enough with Java folks outta here ... i took the annotations name from the Spring framework

... Oups, i forgot to separate the main application from the controller ... sorry:) hehe

- Request Mapping: @PostMapping, @GetMapping (for now), you can implement the rest if you want
- Path segment: ':id' instead of '{id}'
- Route param: @PathVariable, @RequestBody, @RequestParam
- Instead of @SpringApplication, i used @OraApplication

### 🚧 Do not use this in production !!!

## CRUD example

```typescript
import { OraApplication, GetMapping, AbstractOraApplication, PathVariable, RequestParam, Type, Default, PostMapping, RequestBody } from "./ora";

const port = 5000;

// ... i was out of my mind... then embedded all the RequestMapping inside the Application Lol...
// ofc, it lives upon Expressjs framework... maybe we should switch to fastify now ig...
// anyway this is a demo on how typescript (Experimental Decorators) can be used to do 'Metaprogramming', <non-experimental decorators is already available but ... nothing>
// Please do not use this in production!!!

@OraApplication(port)
export class Application extends AbstractOraApplication {
  private _lastAddedId = 2;
  // internal data, but ofc you can use your database Lol
  private todos: Todo[] = [
    {
      id: 1,
      title: "code"
    },
    {
      id: 2,
      title: "write notes"
    }
  ]

  @GetMapping("/todos")
  public getAll(@RequestParam("search", Default("")) search: string) {
    return this.todos.filter(
      todo => todo.title.includes(search)
    );
  }


  @GetMapping("/todos/:id")
  public getById(@PathVariable("id", Type("number")) id: number) {
    const todo = this.todos.find(
      todo => todo.id === id
    );
    if (!todo) {
      throw new Error(`Todo#${id} not found.`); // TODO: better error printer
    }
    return todo;
  }

  @PostMapping("/todos")
  public create(@RequestBody() todo: CreateTodoDto) {
    if (!todo.title) {
      throw new Error("'title' field is mandatory");
    }
    this.todos.push({
      ...todo,
      id: ++this._lastAddedId
    });
    return this.todos;
  }
}

interface Todo {
  id: number;
  title: string;
}

type CreateTodoDto = Pick<Todo, 'title'>;

// start your application here
const app = new Application();
app.start();
```
