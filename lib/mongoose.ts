import mongoose from "mongoose";
import { mongoUrl } from "~/config";
import { append } from "~/lib/main";
import { model, SchemaDefinitionProperty } from "mongoose";
import { SchemaPostOptions, SchemaPreOptions } from "mongoose";
import { DocumentDefinition, Model, Schema, Document } from "mongoose";
import { MongooseQueryMiddleware, MongooseDocumentMiddleware } from "mongoose";
import { Logger } from "~/lib/logger";

append(function mongooseConnect() {
  mongoose.connect(mongoUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }, (err) => {
    if (err) Logger.error(err)
    else Logger.log('Mongoose connect')
  })
}) 

type Middle = 'aggregate' |
  'insertMany' |
  RegExp |
  MongooseQueryMiddleware |
  MongooseDocumentMiddleware |
  MongooseQueryMiddleware[] |
  MongooseDocumentMiddleware[]

interface Prepost {
  pre: boolean
  name: Middle
  options?: SchemaPostOptions | SchemaPreOptions
  middle: Function
}

class Base extends Document {
  static _name: string
  static _schema: Schema
  static _preposts: Prepost[]
  static _methods: { [key: string]: Function }

  private $__setSchema() {
    super['$__setSchema'](this['__proto__'].constructor._schema)
  }

}

export { Base }

type FieldType<T> = SchemaDefinitionProperty<DocumentDefinition<T>>
type Desc = PropertyDescriptor

export * from "mongoose"

export const field = <V = undefined>(type?: FieldType<V>) => {
  return <T extends typeof Base>(base: T['prototype'], name: string) => {
    const { constructor } = base as any as { constructor: T }

    if (!constructor._schema)
      constructor._schema = new Schema()

    const { _schema } = constructor
    constructor._schema = new Schema({ ..._schema.paths, ...{ [name]: type || Schema.Types.Mixed } })
  }
}

export const method = () => {
  return <T extends typeof Base>(base: T['prototype'], name: string, { value }: Desc) => {
    const { constructor } = base as any as { constructor: T }

    if (!constructor._methods)
      constructor._methods = {}

    const { _methods } = constructor
    _methods[name] = value
    return { value: undefined }
  }
}

export const prepost = (pre: 'pre' | 'post', name: Middle, options?: SchemaPreOptions | SchemaPostOptions) => {
  return <T extends typeof Base>(base: T['prototype'], _: string, { value }: Desc) => {
    const { constructor } = base as any as { constructor: T }

    if (!constructor._preposts)
      constructor._preposts = []

    const { _preposts } = constructor
    _preposts.push({
      pre: pre == 'pre',
      name,
      options,
      middle: value
    })
    return { value: undefined }
  }
}

export const pre = (name: Middle, options?: SchemaPreOptions) => {
  return prepost('pre', name, options)
}

export const post = (name: Middle, options?: SchemaPostOptions) => {
  return prepost('post', name, options)
}

export const schema = (name?: string) => {
  return function <T extends typeof Base>(base: T) {
    if (!name) name = base.name
    base._name = name
  }
}

export function makeModel<T extends Base, V extends typeof Base>(base: (new (...doc) => T) & V) {
  const { _schema, _methods, _preposts } = base

  for (let key in _methods || [])
    _schema.method(key, _methods[key] as any)

  for (let { name, pre, options, middle } of _preposts || []) {
    if (pre) {
      if (!options) _schema.pre(name as any, middle as any)
      else _schema.pre(name as any, options, middle as any)
    } else {
      if (!options) _schema.post(name as any, middle as any)
      else _schema.post(name as any, options, middle as any)
    }
  }

  return model<T>(base._name, base._schema) as V & Model<T>
}

export { mongoose }
export default mongoose