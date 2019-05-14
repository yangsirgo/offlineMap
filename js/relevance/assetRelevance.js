
var departmentArray = [];
var assetTreeArray = [];
var tableAssetObj = {
    SSXQGAJG : "",
    assetType : ""
};
// var insertNodeArr = [
//     // {
//     //     id:1,
//     //     assetType:"host",
//     //     assetTypeName:"test",
//     //     x:300,
//     //     y: 400
//     // }
// ];//新建插入画布的节点
var insertNodeArr = [];//新建插入画布的节点
var canvasInnerNodeArr = [];//ajax传递的数据node


$(function () {
    // 获取左侧菜单
    getRoleList(0);
    getDepartmentTree();
    // li点击效果
    $('body').on('click', '.left_ul li', function () {
        // 初始化中间部分列表
        if (!$(this).hasClass('l_active')) {
            $('.left_ul .l_active').toggleClass('l_active');
            $(this).toggleClass('l_active');
        }

        var graphid= $(this).attr("id");
        getData(graphid);
    });

    $("#addBtn").click( function (e){
        if(e.target.getAttribute("disabled") == "disabled")return;
        var addWindow = parent.parentOpenLayerFn({
            id: 'addWindow',
            title: '添加资产',
            autoFocus: false,
            content: $('#addRelWin').html(),
            btn: [{
                text: '确定',
                enter: false,//响应回车
                action: function (dom) {//参数为当前窗口dom对象
                    canvasAddNodeFn();
                }
            }, {
                text: '取消',
                action: function () {

                }
            }],
            success: function (dom) {//参数为当前窗口dom对象
                renderRelDetailsVue($(dom).find('#add_rel_win')[0]);
            },
            end: function (dom) {//参数为当前窗口dom对象

            }
        });
    })

    $("#saveBtn").click(function (e){
        savedata()
    })

    //取消画布的右击默认事件
    $('#main').bind('contextmenu',function(e){return false;});
});


/**
 * @Description: 添加节点
 * @param:
 * @date 2019/4/2
*/
function canvasAddNodeFn (){
    var optionList = [];
    insertNodeArr.forEach(function (item,index){
        var option = {
            id:item.id,
            x:100,
            y:50 + index*85,
            type:item.assetType,
            name:item.SBMC,
            status:"normal"
        };
        var node = zrCreateNode(option);
        zr.add(node);
        nodes.push(node);
        optionList.push(option);
    });

    sendNodeLinkInfoToBack(optionList,null,1);
}

/**
 * @Description: 发送数据到后台
 * @param:
 * @date 2019/4/2
*/
function sendNodeLinkInfoToBack(optionList,linksList,flag){
    var optionList = optionList || [];
    var linksList = linksList || [];

    var circleId = $(".left_ul").find(".l_active").attr("id");
    // var circleId = 11;
    var ajaxObject = {
        assetCircleId : circleId,
        link :[],
        node : []
    };
    optionList.forEach(function (item,index){
        var nodeSinggle =     {
            assetId: item.id,
            // assetTypeId : item.type,
            positionX: item.x,
            positionY: item.y
        };
        ajaxObject.node.push(nodeSinggle);
    });
    linksList.forEach(function (item,index){
        var linkSinggle =     {
            assetIdFrom : item.source,
            assetIdTo : item.target,
            relationTypeValue : item.type,
            oneToN : item.oneToN || ""
        };
        ajaxObject.link.push(linkSinggle);
    });
    $.ajax({
        url:_DEV_DOMAIN_ + "/asset-hub/api/asset/circle/addCircleReation",
        data:JSON.stringify(ajaxObject),
        type: "post",
        dataType: "json",
        contentType: "application/json;charset=utf-8",
        success:function (data){
            if(data.resultCode != 0) {
                gd.showError(data.resultMsg || "添加节点失败");
                var graphid= $(".left_ul").find(".l_active").attr("id");
                getData(graphid);
            } else {
                if(flag == 1) {
                    var graphid= $(".left_ul").find(".l_active").attr("id");
                    getData(graphid);
                }
            }
        }
    })
}
/**
 * @Description: 删除节点或者连线
 * @param:
 * @date 2019/4/2
*/
function deleteNodeOrLinkFn (option,callback){
    var circleId = $(".left_ul").find(".l_active").attr("id");
    // var circleId = 11;
    var data = {
        assetId: option.id || "",
        circleId : circleId,
        reationId : option.reationId || ""
    };
    gd.post(_DEV_DOMAIN_ + "/asset-hub/api/asset/circle/deleteCircleReation",data,function (data){
        if(data.resultCode == 0){
            callback && callback();
            var graphid= $(".left_ul").find(".l_active").attr("id");
            getData(graphid);
        }else {
            gd.showError(data.resultMsg || "删除节点失败");
        }
    })
}


/**
 * 添加资产Vue
 * @param dom
 */
function renderRelDetailsVue(dom,assetTypeId) {
    var assetRelArray = [];
    var assetRelType = '';
    var selDepName = '';
    var selDepId = '';
    var searchStr = '';
    var oneToN = '';
    // 获取关系下拉列表
    $.ajax({
        url: _DEV_DOMAIN_ + '/asset-hub/api/asset/assetType/leftTreeWithWhole',
        //请求参数
        type: 'get',
        async: false,
        success: function (res) {
            if (res.resultCode == 0) {
                assetTreeArray = res.data;
                assetRelType = "摄像机";
                var filterArr = res.data.filter(function (item,index){
                    return item.name == "摄像机";
                });
                if(filterArr[0]) {
                    tableAssetObj.assetType = filterArr[0].id;
                }
            }
        }
    });

    addRelWinVue = new Vue({
        el: dom,
        mixins: [mixin],
        data: {
            assetRelType: assetRelType,
            selDepName: selDepName,
            toolbarConfig: [
                {
                    type: 'searchbox',
                    placeholder: "",
                    action: function (val) {
                        searchStr = val;
                        gd.table('relTable').reload(1, {
                            assetType: assetRelType,
                            searchStr: searchStr,
                            inputQuality: 100,
                            SSXQGAJG: selDepId
                        });
                    }
                }
            ],
            assetTreeTableConfig: {
                id: 'assetTree', //树的id，用于提供API
                simpleData: true, //简单模式，默认为true，标准模式可以不考虑，提供一个转换数据的方法，详见API
                showCheckBox: false, //默认是false;显示checkbox
                linkable: true, //默认是true 父子联动
                data: assetTreeArray,
                onSelect: function (n) {
                    tableAssetObj.assetType = n.id;
                    addRelWinVue.assetRelType = n.name;
                    addRelWinVue.$refs.customSelect1.isDroped = false;
                    gd.table('relTable').reload(1, {
                        assetType: tableAssetObj.assetType,
                        searchStr: searchStr,
                        inputQuality: 100,
                        SSXQGAJG: tableAssetObj.SSXQGAJG
                    });
                },
                onChange: function (n) {

                }
            },
            treeTableConfig: {
                id: 'relDepTree', //树的id，用于提供API
                simpleData: true, //简单模式，默认为true，标准模式可以不考虑，提供一个转换数据的方法，详见API
                showCheckBox: false, //默认是false;显示checkbox
                linkable: true, //默认是true 父子联动
                data: departmentArray,
                onSelect: function (n) {
                    log(n);
                    addRelWinVue.selDepName = n.name;
                    tableAssetObj.SSXQGAJG = n.id;
                    addRelWinVue.$refs.customSelect.isDroped = false;
                    gd.table('relTable').reload(1, {
                        assetType: tableAssetObj.assetType,
                        searchStr: searchStr,
                        inputQuality: 100,
                        SSXQGAJG: tableAssetObj.SSXQGAJG
                    });
                },
                onChange: function (n) {

                }
            },
            relTableConfig: {
                id: 'relTable',//给table一个id,调用gd.tableReload('demoTable');可重新加载表格数据并保持当前页码，gd.tableReload('demoTable'，1)，第二个参数可在加载数据时指定页码
                length: 20, //每页多少条,默认50，可选
                curPage: 1, //当前页码，默认1，可选
                lengthMenu: [20, 30, 50, 100], //可选择每页多少条，默认[10, 30, 50, 100]，可选
                enableJumpPage: false, //启用跳页，默认false，可选
                enableLengthMenu: true, //启用可选择每页多少条，默认true，可选
                enablePaging: true,//启用分页,默认true，可选
                orderColumn: '',//排序列
                orderType: '',//排序规则，desc或asc,默认desc
                columnResize: true, //启用列宽调，默认true，可选
                ajax: {
                    //其它ajax参数同jquery
                    url: _DEV_DOMAIN_ + '/asset-hub/deviceInfo/getAssetInfoList',
                    //改变从服务器返回的数据给table
                    dataSrc: function (data) {
                        data.rows = data.rows.map(function (obj) {
                            return [
                                obj.id,
                                obj.IPV4,
                                obj.SBMC,
                                obj.SBBM,
                                obj.SSXQGAJGName,
                                obj.filed1,
                            ]
                        });
                        return data;
                    },
                    //请求参数
                    data: {
                        assetType: tableAssetObj.assetType,
                        searchStr: searchStr,
                        inputQuality: 100,
                        SSXQGAJG: ''
                    }
                },
                columns: [
                    {
                        name: 'checkbox',
                        type: 'checkbox',
                        width: '50',
                        disabled: function (cell, row, raw) {//禁用checkbox
                            var flag = false;
                            canvasInnerNodeArr.some(function (item,index){
                                if(item.id == cell) {
                                    flag = true;
                                    return true;
                                } else {
                                    flag = false;
                                }
                            });
                            return flag;
                        },
                        change: function (data,dataList) {
                            insertNodeArr = dataList;
                        }
                    },
                    {
                        name: 'IPV4',//本列如果有排序或高级搜索，必须要有name
                        head: 'IP',
                        show: true,//是否展示该列，默认为true
                        title: function (cell, row, raw) {//设置title，cell为本格数据，row为本行加工后的数据，raw为本行未加工的数据,也可以直接传一个true,将以cell作为title
                            return cell
                        },
                        render: function (cell, row, raw) {//自定义表格内容
                            return cell;
                        }
                    },
                    {
                        name: 'SBMC',
                        head: '资产名称',
                        title: function (cell, row, raw) {//设置title，cell为本格数据，row为本行加工后的数据，raw为本行未加工的数据
                            return cell
                        }
                    },
                    {
                        name: 'SBBM',
                        head: '资产编码',
                        title: true,
                    },
                    {
                        name: 'SSXQGAJGName',
                        head: '所属辖区公安机关',
                        title: true,
                    },
                    {
                        name: "filed1",
                        head: '备注',
                    }
                ]
            }
        },
        methods: {
            selChange: function () {}
        },
        mounted: function () {

        }
    });
}


// vue
var roleConfigApp = new Vue({
    el: '#content_box',
    data: {
        toolbarConfig: [{
            type: 'button',
            icon: 'icon-add',
            title: '新建',
            action: function () {
                addPart();
            }
        }, {
            type: 'button',
            icon: 'icon-delete',
            title: '删除',
            disabled: true,
            action: function () {
                deleteRole();
            }
        }, {
            type: 'button',
            icon: 'icon-edit',
            title: '编辑',
            disabled: true,
            action: function () {
                editPart();
            }
        }]
    }
});

// 删除角色
function deleteRole() {
    // 获取当前角色id
    var roleId = $('.left_ul .l_active').attr('role_id');
    var dom = gd.showConfirm({
        id: 'wind',
        content: '确定要删除吗?',
        btn: [{
            text: '删除',
            class: "gd-btn-danger",
            enter: true, //响应回车
            action: function (dom) {
                // 执行删除
                $.ajax({
                    url: _DEV_DOMAIN_ + '/asset-hub/api/asset/circle/delete',
                    type: "post",
                    data: {
                        "id": $(".left_ul .l_active").attr('id')
                    },
                    success: function (res) {
                        if (0 == res.resultCode) {
                            if (0 == res.resultCode) {
                                getRoleList(0);
                            } else if (1 == res.resultCode) {
                                gd.showError("删除失败");
                            }
                        }
                    }
                });
            }
        }, {
            text: '取消',
            action: function () {
            }
        }],
        success: function (dom) {
        },
        end: function (dom) {
            // getRoleList(0);
        }
    });
}

function editPart () {
    addRoleWindow = parent.parentOpenLayerFn({
        id: 'editWind', //可传一个id作为标识
        title: '编辑资产关系图', //窗口标题
        content: $(".addwindow").html(),
        size: [560, 250],
        btn: [{
            text: '确定',
            enter: true,
            action: function (dom) {
                if (validate.valid()) {
                    var name = parent.$("#editWind input").val().trim();
                    var id = $('.left_ul').find(".l_active").attr("id");
                    $.ajax({
                        url: _DEV_DOMAIN_ + '/asset-hub/api/asset/circle/update',
                        type: "post",
                        dataType: 'JSON',
                        contentType: 'application/json',
                        data: JSON.stringify({
                            "circleName": name,
                            "id":id
                        }),
                        success: function (res) {
                            if (0 == res.resultCode) {
                                getRoleList(name);
                                addRoleWindow.close();
                            } else if (1 == res.resultCode) {
                                gd.showWarning(res.resultMsg);
                            }
                        }
                    });
                } else {
                    return false;
                }
                return false;//阻止弹窗自动关闭
            }
        }, {
            text: '取消',
            action: function () {
            }
        }],
        success: function (dom) { //参数为当前窗口dom对象
            creatRoleVue(dom);
            var id = $('.left_ul').find(".l_active").attr("id");
            var name = $('.left_ul').find(".l_active").attr("name");
            dom.find("input").val(name);
            validate = parent.gd.validate(parent.$('#editWind #new_role_name'), {
                autoPlaceholer: true
            });
        },
        end: function (dom) {
        }
    })
}

// 新建角色
function addPart() {
    addRoleWindow = parent.parentOpenLayerFn({
        id: 'addWind', //可传一个id作为标识
        title: '新建资产关系图', //窗口标题
        content: $(".addwindow").html(),
        size: [560, 250], //窗口大小，直接传数字即可，也可以是['600px','400px']
        btn: [{
            text: '确定',
            enter: true, //响应回车
            action: function (dom) { //参数为当前窗口dom对象
                if (validate.valid()) { //获得整体的校验结果
                    var name = parent.$("#addWind input").val().trim();
                    $.ajax({
                        url: _DEV_DOMAIN_ + '/asset-hub/api/asset/circle/add',
                        type: "post",
                        dataType: 'JSON',
                        contentType: 'application/json',
                        data: JSON.stringify({
                            "circleName": name,
                            "id":""
                        }),
                        success: function (res) {
                            if (0 == res.resultCode) {
                                getRoleList(name);
                                addRoleWindow.close();
                                // var graphid= $(".left_ul").find(".l_active").attr("id");
                                // getData(graphid);
                            } else if (1 == res.resultCode) {
                                gd.showWarning(res.resultMsg);
                            }
                        }
                    });
                } else {
                    return false;
                }
                return false;//阻止弹窗自动关闭
            }
        }, {
            text: '取消',
            action: function () {
            }
        }],
        success: function (dom) { //参数为当前窗口dom对象
            creatRoleVue(dom);
            validate = parent.gd.validate(parent.$('#addWind #new_role_name'), {
                autoPlaceholer: true //自动添加placeholder，默认为false
            });
        },
        end: function (dom) {
        }
    })
}

// 获取部门树
function getDepartmentTree() {
    $.get(_DEV_DOMAIN_ + '/uaa/api/gdui/dept/tree/list', {}, function (res) {
        if (0 == res.resultCode) {
            departmentArray = res.data;
        }
    });
}

// 取左侧角色列表
function getRoleList(flag) {
    $.get(_DEV_DOMAIN_ + '/asset-hub/api/asset/circle/list', {}, function (res) {
        if (0 == res.resultCode) {
            if(res.data.length > 0) {
                roleConfigApp.toolbarConfig[1].disabled = false;
                roleConfigApp.toolbarConfig[2].disabled = false;
            } else {
                roleConfigApp.toolbarConfig[1].disabled = true;
                roleConfigApp.toolbarConfig[2].disabled = true;
            }
            $('.left_ul').html(template('role_box', res));
            if (null != res.data) {
                if(res.data.length > 0){
                    $("#addBtn").removeAttr("disabled");
                } else {
                    $("#addBtn").attr("disabled","disabled");
                }
                if (1 == flag) {
                    $('.left_ul').children().last().click();
                } else if (0 == flag) {
                    var elt = $('.left_ul').children().first();
                    if (elt.length > 0) {
                        $('.left_ul').children().first().click();
                    } else {
                        getData(null);
                    }
                } else {
                    $('.left_ul').children().each(function () {
                        if (flag == $(this).text().trim()) {
                            $(this).click();
                        }
                    });
                }
            }
        }
    });
}


//新建 编辑 角色Vue
function creatRoleVue(dom){
    new Vue({
        el:dom.find("#new_role_name")[0],
        data : {
            role_value:""
        },
        computed : {
            gdvRemote :function (){
                return _DEV_DOMAIN_ + '/asset-hub/api/asset/circle/check-circleName?circleName=' + this.role_value;
            }
        }
    })
}

function  initCanvasGlobal(){
    nodes = [];//节点
    links = [];//连线
    labels = [];//label
    arrows = [];//箭头
    linkbtn = false;
    onHander = null;// 对象在鼠标上
    sourceid ="";
    linkrela ="";
    targetid ="";
}
