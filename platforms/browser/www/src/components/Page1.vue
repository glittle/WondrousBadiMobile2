<template>
    <div class="Today">
        <div class="TodayTitle">{{ TodayTitle }}</div>
        <div>Hello!!!</div>
    </div>
    <div class="Copyright">All product names, logos, and brands are property of their respective owners.</div>
</template>

<script>
    export default {
        data () {
            return {
                // Note: modifying `msg` below will not cause changes to occur with
                // hot-reload. As reloaded components preserve their initial state,
                // modifying these values will have no effect.
                msg: [
                    'Phonegap',
                    'meets',
                    'Vue.js'
                ]
            }
        },
        created () {
            refreshDateInfo();
        },
        computed:{
            TodayTitle: function(){
                return _di.nearestSunset;
            }
        }
    }
</script>

<style lang="stylus">
    
    /*
     * Variables
     */
    color-phonegap = #2fa0c3
    color-vue = #42b983
    color-muted = #CCCCCC


    .Hello
        flex: 1 0 auto

        display: flex
        flex-direction: column
        align-items: center
        justify-content: center

        > .H1
            color: color-phonegap


    .Logo
        max-height: 100%

        &.Logo-phonegap
            width: 150px

        &.Logo-vue
            width: 120px


    .Lead
        font-size: 2rem

        &.Lead-spacer
            margin: 5px 0 20px
            font-size: 3.5rem

        &.Lead-phonegap
            color: color-phonegap

        &.Lead-vue
            color: color-vue


    .Copyright
        flex 0 0 70px
        font-size: 0.8rem
        color: color-muted
        text-align: center
        padding: 0 40px

</style>