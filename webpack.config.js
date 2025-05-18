const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const JavaScriptObfuscator = require('webpack-obfuscator');

module.exports = {
    entry: './src/script.js', // Your main entry JS file
    output: {
        filename: 'script.[contenthash].js', // Use contenthash for cache-busting in production
        path: path.resolve(__dirname, 'dist'), // Output directory
        clean: true, // Clean the dist folder before each build
    },
    mode: 'production', // Minification is enabled in production mode
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            presets: ['@babel/preset-env'], // Transpile modern JS to browser-compatible version
                        },
                    },
                ],
            },
        ],
    },
    devServer: {
        static: {
            directory: path.join(__dirname, 'dist'),
        },
        compress: true,
        port: 9000,
    },
    plugins: [
        // HTML plugin to generate and minify the HTML file
        new HtmlWebpackPlugin({
            template: 'src/index.html', // Source HTML file
            minify: {
                removeComments: true,
                collapseWhitespace: true,
                removeRedundantAttributes: true,
                useShortDoctype: true,
                minifyJS: true,
                minifyCSS: true,
                minifyURLs: true,
            },
        }),

        // Advanced JavaScript obfuscator plugin to obfuscate the JS code
        new JavaScriptObfuscator({
            compact: true,               // Compact the code for smaller size
            controlFlowFlattening: true, // Flatten control flow to make code harder to follow
            controlFlowFlatteningThreshold: 1, // 100% of the code will be obfuscated
            deadCodeInjection: true,     // Inject dead code to confuse the deobfuscators
            deadCodeInjectionThreshold: 0.9, // 90% of the code will be dead code
            stringArray: true,           // Convert strings into a string array to obfuscate string literals
            stringArrayEncoding: ['base64'], // Encode string array entries in Base64
            stringArrayThreshold: 1,     // 100% of strings will be obfuscated
            transformObjectKeys: true,   // Obfuscate object keys
            rotateStringArray: true,     // Rotate the string array entries for further obfuscation
            selfDefending: true,         // Make it harder for debuggers to detect obfuscation
            simplify: true,              // Simplify the code
            splitStrings: true,
            splitStringsChunkLength: 10,
            renameGlobals: true,         // Rename global variables
            identifierNamesGenerator: 'mangled', // Use mangled names for identifiers (e.g., variable names)
        }, ['src/script.js']), // Ensure the output file is obfuscated
    ],
    optimization: {
        minimize: true, // Enable JS minification
        splitChunks: {
            chunks: 'all', // Automatically splits vendor libraries and shared code
        },
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    compress: {
                        drop_console: true, // Remove console logs
                        drop_debugger: true, // Remove debugger statements
                    },
                    output: {
                        comments: false, // Remove comments in the minified output
                    },
                },
            }),
        ]
    },
};
