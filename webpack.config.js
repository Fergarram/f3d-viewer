const path = require('path');

module.exports = {
    entry: './src/main.ts',
    devtool: "inline-source-map",
    target: 'electron-renderer',
    output: {
        filename: 'index.js',
        path: path.resolve(__dirname, "dist"),
    },
    resolve: {
        extensions: [".ts", ".js"]
    },
    module: {
        rules: [
            { test: /\.ts?$/, loader: "ts-loader" }
        ]
    }
};