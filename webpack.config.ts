import { join } from "path";
import webpack from "webpack";
import { Configuration } from "webpack";

const node_env = process.env.NODE_ENV || ''
const devMode = node_env.toLowerCase() != 'production'

const ext = (callback: () => any) => {
  return 'eval(' + callback.toString()+'())' 
}

export = {
  entry: './src/index.tsx',
  output: {
    path: join(__dirname, 'public'),
    publicPath: '/public/',
    filename: '[name].js'
  },
  resolve: { extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'] },
  mode: devMode ? 'development' : 'production',
  watch: devMode,
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader'
      },
      {
        test: /\.s(a|c)ss$/,
        use: [
          'style-loader',
          'css-loader',
          'sass-loader'
        ]
      }
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      'process': ext(() => ({
        cwd() { return '/' }
      }))
    })
  ],
  externals: {
    "fs": ext(() => ({
      readFileSync() { return '' }
    })),
    "path": ext(() => ({
      join(...args: string[]) { return args.join('/').replace(/\/+/, '/') }
    }))
  }
} as Configuration