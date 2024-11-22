module.exports = {
    extends: [
        'stylelint-config-standard',
        'stylelint-config-sass-guidelines'
    ],
    rules: {
        'max-nesting-depth': 3,
        'selector-max-compound-selectors': 3
    }
};