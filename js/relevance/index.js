
var ctx = '';
var tableVueLayer = null;
var tableVueCheckedData = {};
var checkedRowData = {};

var markerClusterer, datamsg;
var map='';
var markers=[];
var newDataMsg;
$(function () {
    var tmarker;
    var iconNormal = new BMap.Icon("/js/plugins/bdmap/images/icon/cameraIconbg.png", new BMap.Size(32, 32), {
        offset: new BMap.Size(10, 25),
        imageOffset: new BMap.Size(0, 0)
    });
    var iconError = new BMap.Icon("/js/plugins/bdmap/images/icon/cameraIconbgRed.png", new BMap.Size(32, 32), {
        offset: new BMap.Size(10, 25),
        imageOffset: new BMap.Size(0, 0)
    });
    var iconLigan = new BMap.Icon("/js/plugins/bdmap/images/icon/liganbg.png", new BMap.Size(32, 32), {
        offset: new BMap.Size(10, 25),
        imageOffset: new BMap.Size(0, 0)
    });
    var iconAssetBox = new BMap.Icon("/js/plugins/bdmap/images/icon/assetBoxbg.png", new BMap.Size(32, 32), {
        offset: new BMap.Size(10, 25),
        imageOffset: new BMap.Size(0, 0)
    });
    var iconAssetBoxRed = new BMap.Icon("/js/plugins/bdmap/images/icon/assetBoxbgRed.png", new BMap.Size(32, 32), {
        offset: new BMap.Size(10, 25),
        imageOffset: new BMap.Size(0, 0)
    });
    var bottom_left_control = new BMap.ScaleControl({ anchor: BMAP_ANCHOR_BOTTOM_LEFT }); // 左下角，添加比例尺
    var bottom_left_navigation = new BMap.NavigationControl({ anchor: BMAP_ANCHOR_BOTTOM_LEFT }); //左下角，仅包含平移和缩放按钮
    // 百度地图API功能
    map = new BMap.Map("map_demo", { minZoom: 1, maxZoom: 20 });
    //设置地图 主题色
    map.setMapStyle({
        styleJson:mapStyle
    });
    //页面跳转定位
    //map.setCurrentCity("杭州");
    var point;
    var startlongitude = 116.98;
    startlatitude = 36.67;//鄂尔多斯110.0, 39.82  济南116.98 , 36.67 乌鲁木齐 87.68   43.77
    // 加载判断
    reloadurl();
    var isfirst = true;
    if ($(".allboth").hasClass("active")) {
        getView("");
    }
    //左上角点击效果
    $(".status").find("li").on("click", function (e) {
        $(this).addClass("active").siblings().removeClass("active");
        var type = e.target.getAttribute('type');
        markerClusterer.clearMarkers();
        getView("");
        allload(datamsg,type);
        // 初始化table 传参
        tableListAjaxData = {
            assetTypeName: $('.status').find(".active").attr('assetName'),
            searchStr: ""
        };
    })
    map.addEventListener("dragend", function () {
        // getView();
        var bs = map.getBounds();   //获取可视区域
        var bssw = bs.getSouthWest();   //可视区域左下角
        var bsne = bs.getNorthEast();   //可视区域右上角
        var RLongitude = bsne.lng;
        var RLatitude = bsne.lat;
        var LLongitude = bssw.lng;
        var LLatitude = bssw.lat;
        if ($(".allboth").hasClass("active")) {
             dataajaxget(RLongitude, RLatitude, LLongitude, LLatitude, "");
        } else {
             markerClusterer.clearMarkers();
             dataajaxget(RLongitude, RLatitude, LLongitude, LLatitude, "exception");
        }
    });
    map.addEventListener("resize", function () {
        var bs = map.getBounds();   //获取可视区域
        var bssw = bs.getSouthWest();   //可视区域左下角
        var bsne = bs.getNorthEast();   //可视区域右上角
        var RLongitude = bsne.lng;
        var RLatitude = bsne.lat;
        var LLongitude = bssw.lng;
        var LLatitude = bssw.lat;
        if ($(".allboth").hasClass("active")) {
            dataajaxget(RLongitude, RLatitude, LLongitude, LLatitude, "");
        } else {
            dataajaxget(RLongitude, RLatitude, LLongitude, LLatitude, "exception");
        }
    });
    map.addEventListener("zoomend", function(type){//缩放事件
        var bs = map.getBounds();   //获取可视区域
        var bssw = bs.getSouthWest();   //可视区域左下角
        var bsne = bs.getNorthEast();   //可视区域右上角
        var RLongitude = bsne.lng;
        var RLatitude = bsne.lat;
        var LLongitude = bssw.lng;
        var LLatitude = bssw.lat;
        if ($(".allboth").hasClass("active")) {
            dataajaxget(RLongitude, RLatitude, LLongitude, LLatitude, "");
        } else {
            markerClusterer.clearMarkers();
            dataajaxget(RLongitude, RLatitude, LLongitude, LLatitude, "exception");
        }
    });
    //返回原点
    function reback() {
        map.panTo(new BMap.Point(startlongitude, startlatitude));
    }
    //获取可视区域的ajax 的数据
    function getView(obj) {
        var bs = map.getBounds();   //获取可视区域
        var bssw = bs.getSouthWest();   //可视区域左下角
        var bsne = bs.getNorthEast();   //可视区域右上角
        var RLongitude = bsne.lng;
        var RLatitude = bsne.lat;
        var LLongitude = bssw.lng;
        var LLatitude = bssw.lat;
        var flag = obj;
        dataajaxget(RLongitude, RLatitude, LLongitude, LLatitude, flag);
    }

    function dataajaxget(obj, obj1, obj2, obj3, exception) {
        datamsg = "";
        $.ajax({
            type: "get",
            // url: ctx + "/map/deviceInfoListByCoordinate?RLongitude=" + obj + "&RLatitude=" + obj1 + "&LLongitude=" + obj2 + "&LLatitude=" + obj3 + "&flag=" + exception,
            url: _DEV_DOMAIN_ + "/gis/map/getGISList",
            data : {
                jd:obj2,
                wd : obj3,
                jd1 : obj,
                wd1 : obj1,
                assetTypeName : $('.status').find(".active").attr('assetName')
            },
            success: function (msg) {
                datamsg = msg;
                newDataMsg = msg;
                allload(msg);
            },
            error: function (e) {
                //  closeLodingWindow();
            }
        });
    }

    // 所有正常的数据获取
    function allload(obj,assetType) {
        var assetType = assetType || $(".status").find('.active').attr('type');
        map.clearOverlays(); //删除原来的标注
        if (markerClusterer) {
            markerClusterer.removeMarkers(markers);
        }
        map.enableScrollWheelZoom(true); //启用滚轮放大缩小
        map.enableDragging(); //拖拽
        map.enableKeyboard();//启用键盘操作
        map.addControl(bottom_left_control);
        map.addControl(bottom_left_navigation);
        markers = [];
        var content;
        obj.list = obj.data;
        if(obj != ""){
            for (var i = 0; i < obj.list.length; i++) {
                if (obj.list[i].jd != null && obj.list[i].wd != null && obj.list[i].jd != '' && obj.list[i].wd != '') {
                    var tmarker = null;
                    pt = new BMap.Point(obj.list[i].jd, obj.list[i].wd);
                    if (assetType === 'CAMERA') {//如果是摄像头
                        //地图关联了时间异常并有时间异常报警
                        // if ("true" == "true" && obj.list[i].eventCode.substring(11, 12) == "1") {
                        //     tmarker = new BMap.Marker(pt, { icon: iconError });//不正常
                        // }
                        // //地图关联了离线并有离线报警
                        // else if ("true" == "true" && obj.list[i].eventCode.substring(7, 8) == "1") {
                        //     tmarker = new BMap.Marker(pt, { icon: iconError });//不正常
                        // }
                        // //地图关联了图像质量并有图像质量报警
                        // else if("true" == "true" && obj.list[i].eventCode.substr(6,1)=='1'){
                        //     tmarker = new BMap.Marker(pt, { icon: iconError });//不正常
                        // }
                        // //地图关联了冒用并有冒用报警(2-5位都属于冒用)
                        // else if ("true" == "true" && obj.list[i].eventCode.substr(1,4).indexOf('1')>0) {
                        //     tmarker = new BMap.Marker(pt, { icon: iconError });//不正常
                        // }
                        //基它情况是正常,选项卡切换为全部的情况下显示
                        if($(".allboth").hasClass("active")){
                            if (obj.list[i].onlineStatus == 1) {
                                tmarker = new BMap.Marker(pt, {icon: iconNormal});//正常
                            } else {
                                tmarker = new BMap.Marker(pt, {icon: iconError});//异常
                            }
                        }
                    } else if (assetType === 'LIGAN') {
                        tmarker = new BMap.Marker(pt, { icon: iconLigan });//正常
                    } else if (assetType === 'ASSETBOX'){
                        if (obj.list[i].onlineStatus == 1 || obj.list[i].ipv4 == null) {
                            tmarker = new BMap.Marker(pt, {icon: iconAssetBox});//正常
                        } else {
                            tmarker = new BMap.Marker(pt, {icon: iconAssetBoxRed});//异常
                        }
                    }

                    // var typeStatus = ipiconmaker(obj.list[i].deviceType, obj.list[i].status, obj.unsupervise.indexOf(obj.list[i].ip) > -1);
                    // var events = typeconmarker_type(obj.list[i].eventCode);

                    content = '<div class="infobox-wind">' +
                            '<div  class="infobox-wind-head">明盛大厦摄像头</div>' +
                            '<div class="infobox-wind-content">' +
                                '<div class="infobox-wind-item">' +
                                    '<span class="label">IP地址 :</span><span class="label-inner">192.168.11.1</span>' +
                                '</div>' +
                                '<div class="infobox-wind-item">' +
                                    '<span class="label">资产编号 :</span><span  class="label-inner">000000000000000</span>' +
                                '</div>' +
                            '</div>' +
                        '</div>';

                    if (tmarker) {
                        //map.addOverlay(tmarker);// 将标注添加到地图中
                        addClickHandler(obj.list[i], tmarker);
                        // addMouseOverHandler(content, tmarker);
                        if (isfirst && '' != "") {
                            if ('' == obj.list[i].ip) {
                                isfirst = false;
                                var infoWindow = new BMap.InfoWindow(content); // 创建信息窗口对象
                                map.openInfoWindow(infoWindow, point); //开启信息窗口
                            }
                        }
                        markers.push(tmarker);
                    }
                }
            }
        }

        markerClusterer = new BMapLib.MarkerClusterer(map, { markers: markers });
    }
    //点击显示缩略图
    function addClickHandler(obj, marker) {
        var point = new BMap.Point(marker.point.lng, marker.point.lat);
        marker.addEventListener("click", function (e) {
            gd.get (_DEV_DOMAIN_ + '/gis/map/getAssetRelationData',{assetId : obj.id},function (data) {
            // gd.get ('/json/map/layerJson.json',{assetId : obj.id},function (data) {
                if(data.resultCode == 0) {
                    // renderClickBox (data.data);
                    var renderData = {
                        data : data.data,
                        sbmc : obj.sbmc,
                        ipv4 : obj.ipv4,
                        gdUid :obj.gdUid
                    }
                    var assetType = $(".status").find('.active').attr('type');
                    if(assetType === "CAMERA") {
                        if (obj.sxjlx == 1 ||obj.sxjlx == 2) {
                            var content = template('gifBoxWrapper', renderData);
                        }else {
                            var content = template('cameraBoxWrapper', renderData);
                        }
                    } else if (assetType === "LIGAN") {
                        var cameraList = renderData.data.filter (function (item,index){
                            return item.assetType ==1
                        });
                        var boxList = renderData.data.filter (function (item,index){
                            return item.assetType ==3
                        });
                        var liganList = renderData.data.filter (function (item,index){
                            return item.assetType ==2
                        });
                        renderData.data = {};
                        renderData.data.cameraList = cameraList;
                        renderData.data.boxList = boxList;
                        renderData.data.liganList = liganList;
                        var content = template('liGanWrapper', renderData);
                    }else if (assetType === "ASSETBOX") {
                        var cameraList = renderData.data.filter (function (item,index){
                            return item.assetType == 1
                        });
                        var boxList = renderData.data.filter (function (item,index){
                            return item.assetType ==3
                        });
                        var liganList = renderData.data.filter (function (item,index){
                            return item.assetType == 2
                        });
                        renderData.data = {};
                        renderData.data.boxList = boxList;
                        renderData.data.cameraList = cameraList;
                        renderData.data.liganList = liganList;
                        var content = template('assetBoxWrapper', renderData);
                    }
                    var infoWindow = new BMap.InfoWindow(content);
                    map.openInfoWindow(infoWindow, point); //开启信息窗口
                } else {
                    gd.showError(data.msg || '获取关联设备信息失败')
                }
            })
        });
    }
    function sendData(){
        $.ajax({
            type: 'get',
            url: ctx + '/system/videoplaycontroller/getplaystatus?ip='+$(".videohid").val(),
            success: function(msg) {
                if(msg.indexOf("ERROR") > -1){
                    layer.msg(msg.substring(msg.length,msg.lastIndexOf(":")+1),{icon:2,time:0});
                }else{
                    // layer.msg("请稍等，图像正在获取中",{icon:1});
                }
                // videostatus
            },
            error: function(e) {
            }
        })
    }
    //悬浮显示详情
    function addMouseOverHandler(content, marker) {
        marker.addEventListener("mouseover", function (e,n,v) {
            //!$('.thumbnail-box').width()表示没有在显示缩略图
            if (!$('.thumbnail-box').width()) {
                var p = e.target;
                var point = new BMap.Point(p.getPosition().lng, p.getPosition().lat);
                // var infoWindow = new BMap.InfoWindow(content); // 创建信息窗口对象
                // map.openInfoWindow(infoWindow, point); //开启信息窗口
                var bmap = $('.infobox-wind').closest('.BMap_pop');
                $(bmap).find('>div:eq(0)').addClass('border-top-left-radius');
                $(bmap).find('>div:eq(2)').addClass('border-top-right-radius');
                $(bmap).find('>div:eq(4)').addClass('border-bottom-left-radius');
                $(bmap).find('>div:eq(6)').addClass('border-bottom-right-radius');
                $(bmap).find('>img').hide();
            }
            $('.BMap_pop').css({"top":$('.BMap_pop').css('top')-50});
        });
        marker.addEventListener("mouseout", function (e) {
            if (!$('.thumbnail-box').width()) {
                map.closeInfoWindow();//不是缩略图才关闭
            }
        });
    }
    //右键监听事件 获取经纬度信息
    map.addEventListener("rightclick", function (e) {
        $("#longopen").val(e.point.lng);
        $("#latopen").val(e.point.lat);
    });
    //右键添加点击实现弹窗
    var menu = new BMap.ContextMenu();
    function rightAdd() {
        var txtMenuItem = [
            {
                text: '<div style="height:30px;line-height:30px;width:130px;position:relative;top:-40px"><img src="http://124.128.235.42:1234/tsa/skin/blue/images/map/addbg.png" ><span style="position:relative;left:30px;top:-51px;color:#fff;"><i class="icon-font icon-guanlian"></i>&nbsp;&nbsp;关联设备...</span></div>',
                callback: function () {
                    $("#getzoomed").val(map.getZoom());
                    beanInfo();
                }
            }
        ];
        for (var i = 0; i < txtMenuItem.length; i++) {
            menu.addItem(new BMap.MenuItem(txtMenuItem[i].text, txtMenuItem[i].callback, 100));
        }
        map.addContextMenu(menu);
    }
    // 关联设备弹窗
    function beanInfo(id) {

        gd.showLayer({
            id: 'relativeAsset',
            title: '关联设备',
            content: $('#relateAsset').html(),
            btn : [
                {
                    text: '确定',
                    action: function () {
                        var relateAjaxData = {
                            id:tableVueCheckedData.id,
                            JD:$("#longopen").val(),
                            WD:$("#latopen").val()
                        };

                        gd.post(_DEV_DOMAIN_ + "/gis/map/updateJWDById", relateAjaxData,function (data){
                            if(data.resultCode == 0) {
                                /*var tempPoint = new BMap.Point(relateAjaxData.JD, relateAjaxData.WD);
                                var marker = new BMap.Marker(tempPoint, {icon: iconNormal});
                                map.addOverlay(marker);
                                addClickHandler(checkedRowData, marker);*/
                                // getView();
                                var bs = map.getBounds();   //获取可视区域
                                var bssw = bs.getSouthWest();   //可视区域左下角
                                var bsne = bs.getNorthEast();   //可视区域右上角
                                var RLongitude = bsne.lng;
                                var RLatitude = bsne.lat;
                                var LLongitude = bssw.lng;
                                var LLatitude = bssw.lat;
                                if ($(".allboth").hasClass("active")) {
                                    dataajaxget(RLongitude, RLatitude, LLongitude, LLatitude, "");
                                } else {
                                    markerClusterer.clearMarkers();
                                    dataajaxget(RLongitude, RLatitude, LLongitude, LLatitude, "exception");
                                }
                                var type = $(".status").find("li.active").attr('type');
                                markerClusterer.clearMarkers();
                                getView("");
                                allload(newDataMsg, type);
                                // 初始化table 传参
                                tableListAjaxData = {
                                    assetTypeName: $('.status').find(".active").attr('assetName'),
                                    searchStr: ""
                                };
                            }
                        });
                    }
                }, {
                    text: '取消',
                    action: function () {
                        // gd.showSuccess('你点了取消');
                    }
                }
            ],
            success: function (dom) {
                renderTableVue();
            },
            end: function (dom) {

            }
        })
    }
    rightAdd();
    // 监听地图是否结束
    // map.addEventListener("tilesloaded", function() {
    //     //layer.msg("地图加载完毕");
    // });

    //定时请求刷新 目前是5分钟
    // setInterval(runAjax, 300000);
    //ajax方法执行
    function runAjax() {
        window.location.href = location.href;
    }
    //页面进入加载判断函数
    function reloadurl() {
        if (getSearchurl("zoomed") && getSearchurl("longopen") && getSearchurl("latopen")) {
            point = new BMap.Point(getSearchurl("longopen"), getSearchurl("latopen"));
            map.centerAndZoom(point, getSearchurl("zoomed"));
        } else {
            if ('' == "") {
                point = new BMap.Point(startlongitude, startlatitude);
                map.centerAndZoom(point, 15);
            } else {
                $(".nav_location").closest("a").addClass("listclick")
                point = new BMap.Point('', '');
                map.centerAndZoom(point, 19);
            }
        }
    }

    // 获取url数值
    function getSearchurl(name) {
        // var search = window.location.search.split("?")[1];
        // if(search) {
        //     search = search.split("&");
        // }
        var value = "";
        // for (var i = 0; i < search.length; i++) {
        //     var item = search[i].split("=");
        //     if (item[0] == name) {
        //         value = item[1];
        //         break;
        //     }
        // }
        return value;
    }
});

/**
 * 字符串格式化
 */
String.prototype.format = function () {
    if (arguments.length == 0) return this;
    for (var str = this, i = 0; i < arguments.length; i++)
        str = str.replace(new RegExp("\\{" + i + "\\}", "g"), arguments[i]);
    return str;
};

var tableListAjaxData = {
    assetTypeName: $('.status').find(".active").attr('assetName'),
    searchStr: ""
};

function renderTableVue(){
    TableVue =  new Vue({
        el: $('#relateAssetDiv')[0],
        data : {
            tableConfig : {
                id: 'demoTable1',
                length: 50, //每页多少条,默认50，可选
                curPage: 1, //当前页码，默认1，可选
                lengthMenu: [10, 30, 50, 100], //可选择每页多少条，默认[10, 30, 50, 100]，可选
                enableJumpPage: false, //启用跳页，默认false，可选
                enableLengthMenu: true, //启用可选择每页多少条，默认true，可选
                enablePaging: true,//启用分页,默认true，可选
                orderType: 'desc',//排序规则，desc或asc,默认desc
                columnResize: true, //启用列宽调，默认true，可选
                ajax: {
                    url: _DEV_DOMAIN_ + '/gis/map/reationDataList',
                    // url: '/json/map/tableDemo.json',
                    dataSrc: function (data) {
                        data.rows = data.rows.map(function (obj) {
                            return [
                                {
                                    id : obj.id,
                                    JD : obj.jd,
                                    WD : obj.wd
                                },
                                obj.ipv4,
                                obj.sbmc,
                                obj.sbbm,
                                obj.ssxqgajg,
                                obj.remark
                            ]
                        });
                        return data;
                    },
                    //请求参数
                    data:tableListAjaxData
                },
                columns: [
                    {
                        name: 'checkbox',
                        type: 'checkbox',
                        single: true,
                        width: '60', //列宽
                        align: 'center',
                        change: function (data, raw) {
                            tableVueCheckedData = data[0][0];
                            checkedRowData = raw[0];
                        }
                    },
                    {
                        name: 'ipv4',//本列如果有排序或高级搜索，必须要有name
                        head: 'IP',
                        orderable: true,//启用排序
                        show: true
                    },
                    {
                        name: 'sbmc',
                        head: '资产名称',
                        orderable: true,
                        title: true
                    },
                    {
                        name: 'sbbm',
                        head: '资产编码',
                        align: 'center'
                    },
                    {
                        name: 'ssxqgajg',
                        head: '所属辖区公安机关',
                        align: 'center',
                        filters : "#tree_box"
                    },
                    {
                        name: 'remark',
                        head: '备注',
                        align: 'center',
                        render: function (cell, row, raw) {//自定义表格内容
                            return cell==null? "--":cell;
                        }
                    }
                ]
            },
            toolbarConfig : [
                {
                    type: 'searchbox',
                    placeholder: "IP/资产名称/资产编码",
                    action: function (val) {
                        /*****************  过滤特殊字符 START  ******************/

                        var specialReg = new RegExp("[`~!@#$^&*()=|{}':;',\\[\\]<>/?~！@#￥……&*（）——|{}【】‘；：”“'。，、？%+_]");
                        var specialStr = '';
                        var isSpecial = false;
                        for (var i = 0; i < val.length; i++) {
                            if (specialReg.test(val[i])) {
                                specialStr += val[i];
                                isSpecial = true;
                            }
                        }
                        if(isSpecial){
                            gd.showError('不允许输入特殊字符  ' + specialStr, { time: 1000 });
                            return;
                        }
                        /*****************  过滤特殊字符 END  ******************/
                        tableListAjaxData.searchStr = val;
                        gd.table("demoTable1").reload(1, tableListAjaxData);
                    }
                }
            ],
            treeTableConfig: {
                id: 'userTree',
                simpleData: true,
                showCheckBox: true,
                linkable: true,
                data: [],
                onSelect: function (n) {},
                onChange: function (n) {
                    var ids = n.map(function (node) {
                        return node.id
                    });
                    gd.table('demoTable1').setFilterValue('ssxqgajg', ids.join(';'))
                }
            }
        },
        mounted : function () {
            gd.get(_DEV_DOMAIN_ + "/uaa/api/gdui/dept/tree/list",function (data) {
                // gd.get("/json/map/tree.json",function (data) {
                if(data.resultCode == 0) {
                    gd.tree('userTree').setData(data.data);
                } else {
                    gd.showError (data.msg || '所属辖区公安机关树获取失败')
                }
            });
        }
    })
}
