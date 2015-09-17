/**
 * Created by JS on 2015/9/15.
 */
define(function(require){

    require('zepto');

    var Area = function(opts){

        this._opts = opts || {};

        this._defaults = {

            id : null,

            provinceID : null,

            cityID : null,

            areaID : null,

            dataUrl : null

        };

        this._options = $.extend({}, this._defaults, this._opts);

        this.init();

    };

    Area.prototype = {

        init : function(){

            this._initDom();

            this._initEvent();

        },

        _initDom : function(){

            this._area = $('#'+this._options.id);

            this.instanceFlag = false;

            this.selectData = {

                'province' : '',

                'city' : '',

                'area' : ''

            }

        },

        _initEvent : function(){

            this.getData();

            this._area.on('touchstart', '.area-title a', $.proxy(this._areaCtrl, this));

        },

        _areaCtrl : function(e){

            var target = e.target;

            if(target.className === 'area-cancel'){
                console.log('cancel');
            }else if(target.className === 'area-ok'){
                console.log(this.selectData);
            }
            this.destroy();
        },

        getTplByKey : function(key){

            return [
                '<ul>',
                '{{#'+key+'}}',
                '<li code="{{code}}">{{name}}</li>',
                '{{/'+key+'}}',
                '</ul>'
            ].join('');

        },

        getData : function(){

            $.getJSON(this._options.dataUrl, $.proxy(this.success, this));

        },

        success : function(json){

            if(!json) return;

            require('hogan');

            this.json = json;

            //如果没有初始化，则添加默认地区
            !this.instanceFlag && this.setDefaultArea();

        },

        renderHtml : function(id, json){

            if(!this[id+'Template']) this[id+'Template'] = Hogan.compile(this.getTplByKey(id));

            var htmlStr = this[id+'Template'].render(json);

            this[id+'Scroll'] = this.setDomAndStatus(id, htmlStr);

            var me = this;

            var code = this.getCurrentCode(id, 0);

            switch (id){

                case 'province': me.selectData.province = code;break;

                case 'city' : me.selectData.city = code;break;

                case 'area' : me.selectData.province = code;break;

                default : console.log('传入的参数错误');

            }

            //只添加一次监听事件
            if(this[id+'Scroll'].hasListner) return;


            /**
             * 当省滚动结束后，append二级市区数据和三级县镇数据
             *
             *
             * */
            this[id+'Scroll'].on('scrollEnd', function () {

                var _index = Math.round(Math.abs(me[id+'Scroll'].y) / me.liHeight);

                var code = me.getCurrentCode(id, _index);

                //经测试有时候会误触发scrollEnd事件，在此加个检测
                if(!code) return;

                //如果为香港澳门台湾则保存数据并退出
                if(code === '710000' || code === '810000' || code === '820000') {

                    //保存省数据
                    me.selectData.province = code;

                    return;

                }

                if(id === 'province'){

                    me.cityData = me.getRelationData(me.json.province, code);

                    me.renderHtml.call(me, 'city', me.cityData);

                    me.areaData = me.cityData.city[0];

                    me.renderHtml.call(me, 'area', me.areaData);
                    //保存省数据
                    me.selectData.province = code;

                }else if(id === 'city'){

                    me.areaData = me.getRelationData(me.cityData.city, code);

                    me.renderHtml.call(me, 'area', me.areaData);

                    //保存市数据
                    me.selectData.city = code;

                }else if(id === 'area'){

                    //保存区数据
                    me.selectData.area = code;

                    console.log(me.selectData);
                }

                me[id+'Scroll'].hasListner = true;

            });

        },

        getCurrentCode : function(id, index){

            return $('#'+id).find('ul>li')[index].getAttribute('code');

        },

        setDomAndStatus : function(id, htmlStr){

            $('#'+id).html(htmlStr);

            this.listReHeight($('#'+id));

            return this.setScroll(id);

        },


        //获取数据成功后先初始化地区为北京市
        setDefaultArea : function(){

            this.renderHtml('province', this.json);

            this.cityData = this.getRelationData(this.json.province, '110000')

            this.renderHtml('city', this.cityData);

            this.areaData = this.cityData.city[0];

            this.renderHtml('area', this.areaData);

            this.instanceFlag = true;

        },

        //根据code取出对应的数据
        getRelationData : function(data, code){

            //filter过滤出的的数据为数组，需要加0取出
            return data.filter(function(element){
                return (element.code == code)
            })[0]

        },

        listReHeight : function(element){

            var list = element.find('ul');

            var listHeight = list.height();

            var listLen = list.children().length;

            if(!this.liHeight) this.liHeight = Math.round(listHeight / listLen);

            var newHeight = this.liHeight * (listLen - 1);

            list.height(newHeight + element.height());

        },

        setScroll : function(id){

            require('scroll');

            var myScroll = new IScroll('#'+id,{
                scrollX:false,
                scrollY:true,
                tap:true,
                snap: 'li'
            });
            /*setTimeout(function () {
             myScroll.refresh();
             }, 0);*/

            return myScroll;
        },

        destroy : function(){

            this._area.remove();

            Area = null;

        }


    }

    return Area;

})