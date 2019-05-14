// var initGraph = (function(){

var zr = zrender.init(document.getElementById('main'));

var chosenobj = null;
var targetobj = null;

var canvasW = $("#main").width();
var canvasH = $("#main").height();
var onHander = null; // 对象在鼠标上

var linkbtn = false; //是否点了连线按钮
var sourceid ="";
var linkrela ="";
var targetid ="";

//数据接入点
var nodes = [];//节点
var links = [];//连线
var labels = [];//label
var arrows = [];//箭头

//扇形按钮属性
var sectorColor = "#1F564E"; //默认
var sectorColorHover = "#25C2AA";//hover
var sectorR = 60;//外圈半径
var sectorR0 = 32;//内圈半径
var sectorSpace = 0.03;//扇形间隔
var sectorSpeed = 300; //动画时间
var sectorDelay = 0;
var easing = "cubicIn";
var iconSize = 56;

//辅助线属性
var linkLineColor = "#FF0000";//连线辅助线色
var linkLineWidth = 6;//连线辅助线宽

//连线属性
var LineColor = "#1F564E";//连线辅助线色
var LineWidth = 3;//连线辅助线宽
var addOnce = true;

// $(".graphbtn").click(function(){
//
//     var graphid= $(this).attr("id");
//     getData(graphid);
//
// });

function getData(graphid){
    initCanvasGlobal();
    $.ajax({
        // url:"json/"+graphid+".json",
        url:_DEV_DOMAIN_ + "/asset-hub/api/asset/circle/getCircleData",
        dataType:"json",
        data:{
            circleId:graphid
        },
        success:function(res){
            var data = res.data;
            canvasInnerNodeArr = data.node;//添加设备时 画布不能添加相同的设备
            var nodeArr = data.node.map(function (item,index){
                return  {
                    id:item.id,
                    x : item.x,
                    y : item.y,
                    type : item.assetType,
                    typeIcon : item.typeIcon,
                    name : item.assetName,
                    status : item.onlineStatus == 0 ? "normal" :"warn"
                }
            });
            var linkArr = data.links.map(function (item,index){
                return  {
                    type : item.relationType,
                    source : item.assetIdFrom,
                    target : item.assetIdTo,
                    relationName : item.relationName
                }
            });
            data.node = nodeArr;
            data.links = linkArr;
           var nodelist = res.data.node;
           var linklist = res.data.links;
           if (nodelist.length >= 0) {
               zr.clear();
               for (var i = 0; i < nodelist.length; i++) {
                   var option = {
                            id:nodelist[i].id,
                            x:nodelist[i].x,
                            y:nodelist[i].y,
                            type:nodelist[i].type,
                            name:nodelist[i].name,
                            typeIcon : nodelist[i].typeIcon,
                            status:nodelist[i].status
                   }
                   var node = zrCreateNode(option);
                   zr.add(node);
                   nodes.push(node);
               }
           }

           if (linklist.length >= 0) {
               for (var i = 0; i < linklist.length; i++) {
                   var option = {
                       source:findObjtById(linklist[i].source,nodes).obj,
                       target:findObjtById(linklist[i].target,nodes).obj,
                       relationName:linklist[i].relationName,
                       relationType : linklist[i].type
                   }
                   zrCreateLineGroup(option);
               }
           }
        }
      });
}



// $("#saveit").click(function(){
//
//     savedata();
//
// });

function savedata(){

    var node_data = [];

    for (var i = 0; i < nodes.length; i++) {
        node_data.push({
            id:nodes[i].id,
            x:nodes[i].position[0],
            y:nodes[i].position[1],
            type:nodes[i].data.type,
            name:nodes[i].data.name,
            status:nodes[i].data.status
        });
    }

    var link_data = [];

    for (var i = 0; i < links.length; i++) {

        link_data.push({
            id:links[i].id,
            source:links[i].source.id,
            target:links[i].target.id,
            relationName:findObjtById(links[i].id,labels).obj.style.text
        });

    }
    var saveDataObj = {
        node :  node_data,
        link :  link_data
    };
}


/*
注释无用代码
var rightlist = $("#rightlist");

function initRightMenu(devices){
   var str = ""
   for (var i = 0; i < devices.length; i++) {
      str += "<div class=\"devicebtn\" id=\""+devices[i].type+"\" name=\""+devices[i].name+"\"  type=\""+devices[i].type+"\">"+devices[i].name+"</div>"
   }


   rightlist.html(str);

   $(".devicebtn").click(function(){
            if (linkbtn) {return;}
// aa
            if (addOnce) {

                var type= $(this).attr("type");
                var name= $(this).attr("name");

                var option = {
                        type:type,
                        name:name,
                        status:"normal"
                }

                onHander = zrCreateNode(option);
                zr.add(onHander);
                nodes.push(onHander);
                addOnce = false;

            }else{

              //  alert("有对象没放进画布之前只能点一次");

            }


    });
}


function initAll(){

    $.ajax({
        url:"json/devices2.json",
        dataType:"json",
        success:function(res){

             var devices = res.data.devices
             if (devices.length>0) {
                 initRightMenu(devices);
             }

        }

    });

}
initAll();
*/

//create tools obj
var linelink = new zrender.Line({
                    name:"linelink",
                    shape:{
                        x1:0,
                        y1:0,
                        x2:0,
                        y2:0,
                    },
                    style:{
                       lineWidth:linkLineWidth,
                       stroke:linkLineColor
                    },
                    zlevel:0
});


var sectorLink = new zrender.Sector({
                    position:[0, 0],
                    scale:[1,1],
                    name:"linkbtn",
                    shape:{
                        cx:0,
                        cy:0,
                        r:sectorR,
                        r0:sectorR0,
                        startAngle:0,
                        endAngle:Math.PI/2 - sectorSpace,
                        clockwise:true
                    },
                    style:{
                        fill:sectorColor
                    },
                    draggable:false,
                    zlevel:1
});

var sectorDel = new zrender.Sector({
                    position:[0,0],
                    scale:[1,1],
                    name:"delbtn",
                    shape:{
                        cx:0,
                        cy:0,
                        r:sectorR,
                        r0:sectorR0,
                        startAngle:Math.PI/2,
                        endAngle:Math.PI - sectorSpace,
                        clockwise:true
                    },
                    style:{
                        fill:sectorColor
                    },
                    draggable:false,
                    zlevel:1
});

var sectorInfo = new zrender.Sector({
                    position:[0,0],
                    scale:[1,1],
                    name:"infobtn",
                    shape:{
                        cx:0,
                        cy:0,
                        r:sectorR,
                        r0:sectorR0,
                        startAngle:Math.PI,
                        endAngle:Math.PI/2*3 - sectorSpace,
                        clockwise:true
                    },
                    style:{
                        fill:sectorColor
                    },
                    draggable:false,
                    zlevel:1
});

var sectorHelp = new zrender.Sector({
                    position:[0,0],
                    scale:[1,1],
                    name:"helpbtn",
                    shape:{
                        cx:0,
                        cy:0,
                        r:sectorR,
                        r0:sectorR0,
                        startAngle:Math.PI/2*3,
                        endAngle:2*Math.PI - sectorSpace,
                        clockwise:true
                    },
                    style:{
                        fill:sectorColor
                    },
                    draggable:false,
                    zlevel:1
});

var icon_link = new zrender.Image({
                    style:{
                        image:'/asset-hub/images/relevanceImages/link.png',
                    },
                    zlevel:2
});

var icon_del = new zrender.Image({
                    style:{
                        image:'/asset-hub/images/relevanceImages/del.png',
                    },
                    zlevel:2
});

var icon_info = new zrender.Image({
                    style:{
                        image:'/asset-hub/images/relevanceImages/info.png',
                    },
                    zlevel:2
});

var icon_help = new zrender.Image({
                    style:{
                        image:'/asset-hub/images/relevanceImages/help.png',
                    },
                    zlevel:2
});


//连线按钮点击
sectorLink.on('mousedown', function(e){

    if (chosenobj.name == "node") {

        sourceid = chosenobj.id;
        zr.add(linelink);
        linkbtn = true;
        getRelationsByType(chosenobj.data.type);
    }

    if (chosenobj.name == "label") {

        var dom = gd.showConfirm({
            id: 'addLine',
            content: '是否从新连线?',
            btn: [{
                text: '确定',
                class: "gd-btn-danger",
                enter: true,
                action: function (dom) {
                    var source = chosenobj.source;
                    removeLine(chosenobj.id);
                    removeLabel(chosenobj.id);
                    removeArrow(chosenobj.id);
                    removeSector();

                    //从新连线
                    chosenobj = source;
                    sourceid = chosenobj.id;
                    zr.add(linelink);
                    linkbtn = true;
                    getRelationsByType(chosenobj.data.type);
                }
            }, {
                text: '取消',
                action: function () {
                }
            }]
        });

    }


});

function getRelationsByType(type){

    $.ajax({
        // url:"json/relation"+type+".json",
        url:_DEV_DOMAIN_ + "/asset-hub/api/assetTypeRelation/getAssetTypeRelationByType",
        data : {
            assetTypeId : type
        },
        dataType:"json",
        success:function(res){
           showLinkble(res.data);
        }
    });

}


function showLinkble(arr){
    var ajaxNodeList = [];
    if(arr.up == undefined) {
        ajaxNodeList = arr.down;
    } else if($.isArray(arr.up)){
        if(arr.down == undefined){
            arr.down = []
        }
        arr.up.forEach(function (item,index){
            item.isUp = true;
            arr.down.push(item);
        })
        ajaxNodeList = arr.down;
    }
     for (var i = 0; i < ajaxNodeList.length; i++) {
           for (var j = 0; j < nodes.length; j++) {
               if(nodes[j].data.type === ajaxNodeList[i].type){
                    nodes[j].childAt(0).attr({
                        style:{
                            shadowBlur:20,
                            shadowColor:'rgba(255, 0, 0, 1)'
                        }
                    });
                    //node 节点注入 line 相关数据 name 和 relation and oneToN
                    nodes[j].relationName = ajaxNodeList[i].relationName;
                    nodes[j].relation = ajaxNodeList[i].relation;
                    nodes[j].oneToN = ajaxNodeList[i].oneToN;
                    nodes[j].isUp = ajaxNodeList[i].isUp;
                    nodes[j].linkable = true;
               }
           }
     }
}

function closeLinkble(){

    for (var i = 0; i < nodes.length; i++) {

        nodes[i].childAt(0).attr({
                    style:{
                       shadowColor:'rgba(255, 0, 0, 0)'
                    }
        });
        nodes[i].relationName = null;
        nodes[i].linkable = false;
    }

}


// 通过node找相关的link
function findLinksOnNodeList (nodeId){
    var filterArr = links.filter(function (item,index){
        var source = item.source.data;
        var target = item.target.data;
        return source.id == nodeId || target.id == nodeId;
    });
    return filterArr;
}


//删除按钮点击
sectorDel.on('mousedown', function(e){

    if (chosenobj.name == "node") {
        sourceid = chosenobj.id;
        var dom = gd.showConfirm({
            id: 'deleteNode',
            content: '是否删除节点?',
            btn: [{
                text: '删除',
                class: "gd-btn-danger",
                enter: true,
                action: function (dom) {

                    var deleteNodeObj = chosenobj.data;
                    var deleteLineRelationList = [];
                    var deleteLineList = findLinksOnNodeList(deleteNodeObj.id);
                    deleteLineList.forEach(function (item,index) {
                        deleteLineRelationList.push(item.relationType);
                    });

                    var deleteLineAndNodeObj = {
                        id : sourceid,
                        reationId : deleteLineRelationList.toString()
                    };
                    deleteNodeOrLinkFn(deleteLineAndNodeObj,function (){
                        //删除节点
                        removeNode(sourceid);
                        removeSector();
                    });
                }
            }, {
                text: '取消',
                action: function () {
                }
            }]
        });
    }

    if (chosenobj.name == "label") {
        var dom = gd.showConfirm({
            id: 'deleteLine',
            content: '确定要删除线吗?',
            btn: [{
                text: '删除',
                class: "gd-btn-danger",
                enter: true, //响应回车
                action: function (dom) {
                    var reationIdObj = singleLinkInLinks(chosenobj.id);
                    if(reationIdObj){
                        var lineOption = {
                            reationId : reationIdObj.relationType
                        };
                        deleteNodeOrLinkFn(lineOption,function(){
                            // 执行删除
                            removeLine(chosenobj.id);
                            removeLabel(chosenobj.id);
                            removeArrow(chosenobj.id);
                            removeSector();
                        });
                    }
                }
            }, {
                text: '取消',
                action: function () {
                }
            }]
        });
    }


});
//删节点
function removeNode(sourceid){
    var obj = findObjtById(sourceid,nodes);
    nodes.splice(obj.idx,1);
    zr.remove(obj.obj);
}
//删线
function removeLine(lineid){

    var obj = findObjtById(lineid,links);
    links.splice(obj.idx,1);
    zr.remove(obj.obj);

}
//删label
function removeLabel(lineid){

    var obj = findObjtById(lineid,labels);
    labels.splice(obj.idx,1);
    zr.remove(obj.obj);
}
//删箭头
function removeArrow(lineid){

    var obj = findObjtById(lineid,arrows);
    arrows.splice(obj.idx,1);
    zr.remove(obj.obj);
}
//
function findObjtById(id,arr){

   var obj = {};
   if (arr.length > 0) {
       for (var i = 0; i < arr.length; i++) {
            if (id == arr[i].id) {
                obj.idx = i;
                obj.obj = arr[i];
            }
       }
    }

    return obj;
}

/**
 * @Description: 通过线的id 找线
 * @param:
 * @date 2019/4/3
*/
function singleLinkInLinks (lineId){
    if(!lineId) return;
    var linkObj = null;
    links.some(function (item,index) {
        if(lineId == item.id) {
            linkObj = item;
            return true;
        }
    })
    return linkObj
}



sectorLink.on('mouseover', function(e){
    e.target.attr({
          style:{
                fill:sectorColorHover
            }
    });
});

sectorLink.on('mouseout', function(e){
    e.target.attr({
          style:{
                fill:sectorColor
            }
    });
});

sectorDel.on('mouseover', function(e){

    e.target.attr({
            style:{
                fill:sectorColorHover
            }
    });
});

sectorDel.on('mouseout', function(e){

    e.target.attr({
            style:{
                fill:sectorColor
            }
    });
});

sectorInfo.on('mouseover', function(e){
    e.target.attr({
          style:{
                fill:sectorColorHover
            }
    });
});

sectorInfo.on('mouseout', function(e){
    e.target.attr({
          style:{
                fill:sectorColor
            }
    });
});

sectorHelp.on('mouseover', function(e){
    e.target.attr({
          style:{
                fill:sectorColorHover
            }
    });
});

sectorHelp.on('mouseout', function(e){
    e.target.attr({
          style:{
                fill:sectorColor
            }
    });
});


zr.on('contextmenu', function(e){


     if (linkbtn) {
           if(chosenobj){

              removeSector();
              linkbtn = false;


           }
     }


});

zr.on('contextmenu', function(e){
    closeLinkble();
});

zr.on('mousedown', function(e){
    log("zr mousedown");
    if (e.target == undefined) { removeSector();}
     if (onHander) {
         onHander.attr("position",[e.offsetX-28,e.offsetY-28]);
         var childs = onHander.children();
         for (var i = 0; i < childs.length; i++) {
             childs[i].attr({
                style:{
                  opacity:1
                }
             })
         }
         //zr.add(onHander);
         addOnce = true;
         onHander = null;

     }


});




zr.on('mousemove', function(e){

       if (linkbtn) {
           if(chosenobj){
              linelink.attr({
              shape: {
                  x1:chosenobj.position[0]+iconSize/2,
                  y1:chosenobj.position[1]+iconSize/2,
                  x2:e.event.zrX,
                  y2:e.event.zrY
              }
            });
           }
       }



       if (onHander){
             onHander.attr("position",[e.offsetX-28,e.offsetY-28]);
             var childs = onHander.children();
             for (var i = 0; i < childs.length; i++) {
                 childs[i].attr({
                    style:{
                      opacity:0.5
                    }
                 })
             }
       }

});




function zrCreateLine(option){

    var line = new zrender.Line({
               id:option.source.id+"_"+option.target.id,
               source:option.source,
               target:option.target,
               shape:{
                    x1:option.source.position[0]+iconSize/2,
                    y1:option.source.position[1]+iconSize/2,
                    x2:option.target.position[0]+iconSize/2,
                    y2:option.target.position[1]+iconSize/2
                },
                style:{
                    lineWidth:LineWidth,
                    stroke:LineColor
                },
                zlevel:0
    });

    zr.add(line);
    return line;
}

function zrCreatelabel(option){
    var label = new zrender.Text({
                id:option.source.id+"_"+option.target.id,
                source:option.source,
                target:option.target,
                name:"label",
                style:{
                    text:option.target.relationName||option.relationName,
                    textFill:'#BED1E7',
                    textBackgroundColor:"#172547",
                    textPadding:8,
                    textBorderRadius:5,
                    fontSize:13,
                    x:(option.source.position[0]+option.target.position[0])/2+iconSize/2,
                    y:(option.source.position[1]+option.target.position[1])/2+iconSize/2-15,
                    textAlign:"center"
                }
    });

    label.on('mousedown', function(e) {
        log("label mousedown");
          chosenobj = label;

          var option = {
              x:label.style.x-28,
              y:label.style.y-14
          }
          showContrlBtns(option);

    });

    zr.add(label);
    return label;
}


function zrCreateArrow(option){

    var pp = getArrowPosition(option.source,option.target);
    var arrow = new zrender.Image({
                   id:option.source.id+"_"+option.target.id,
                   source:option.source,
                   target:option.target,
                   zlevel:2,
                   style:{
                        image:'/asset-hub/images/relevanceImages/arrow.png',
                        width:16,
                        height:16,
                        x:pp.x,
                        y:pp.y,
                   }
    });

    arrow.attr('origin',[arrow.style.x+arrow.style.width/2,arrow.style.y+arrow.style.height/2]);
    arrow.attr('rotation',[getArrowAngle(pp.vx,pp.vy)]);

    zr.add(arrow);
    return arrow;

}


function renderLinks(){

    for (var i = 0; i < links.length; i++) {

        var source = links[i].source;
        var target = links[i].target;

        links[i].attr({
            shape:{
                x1:source.position[0]+iconSize/2,
                y1:source.position[1]+iconSize/2,
                x2:target.position[0]+iconSize/2,
                y2:target.position[1]+iconSize/2
            }
        })
    }

}


function renderLabels(){

     for (var i = 0; i < labels.length; i++) {

        var source = labels[i].source;
        var target = labels[i].target;

        labels[i].attr({
            style:{
                x:(source.position[0]+target.position[0])/2+iconSize/2,
                y:(source.position[1]+target.position[1])/2+iconSize/2-15,
            }
        })
    }

}

function renderArrows(){

     for (var i = 0; i < arrows.length; i++) {

        var pp = getArrowPosition(arrows[i].source,arrows[i].target);

        arrows[i].attr({
            style:{
               x:pp.x,
               y:pp.y,
            }
        })

        arrows[i].attr('origin',[arrows[i].style.x+arrows[i].style.width/2,arrows[i].style.y+arrows[i].style.height/2]);
        arrows[i].attr('rotation',[getArrowAngle(pp.vx,pp.vy)]);

    }

}

function renderLinkGroup(){

    renderLinks();
    renderLabels();
    renderArrows();

}
/*
var angle = Math.atan(y/x);
var cx=0;
var cy=0;
if(oev.clientX>=obox.offsetLeft && oev.clientY<=obox.offsetTop){
cx = Math.cos(angle)*r;
cy = Math.sin(angle)*-r;
*/
//角度转弧度

function getArrowPosition(source,target){

        var arrowR = 8;
        var linelenth = Math.sqrt(Math.pow((target.position[0]-source.position[0]),2)+Math.pow((target.position[1]-source.position[1]),2));
        var arrowlinelenth = linelenth - 28 - arrowR;

        //向量比值
        var bz = arrowlinelenth/linelenth;

        var vx = (target.position[0]-source.position[0])*bz;
        var vy = (target.position[1]-source.position[1])*bz;

        var fx = source.position[0]+28+vx-8;
        var fy = source.position[1]+28+vy-8;


        var pp = {
            x:fx,
            y:fy,
            vx:vx,
            vy:vy
        }

        return pp;
}

//向量比值换成角度
function getArrowAngle(vx,vy){


        var angle = Math.atan(vy/vx);

        if(vx > 0 && vy > 0){
            angle = - Math.atan(vy/vx);
        }

        if (vx > 0 && vy < 0) {
            angle = - Math.atan(vy/vx);
        }

        if (vx < 0 && vy < 0) {

            angle = Math.PI - Math.atan(vy/vx);
        }

        if (vx < 0 && vy > 0) {

            angle = Math.PI - Math.atan(vy/vx);
        }

        return angle;

}

function zrCreateNode(option){

    var nodeid = (new Date()).getTime();

    if(option.id){ nodeid = option.id}

    var node = new zrender.Group({
                   id:""+nodeid,
                   name:"node",
                   linkable:false,
                   data:option
    });

    var status = new zrender.Image({
        name:'status',
        draggable:true,
        zlevel:2,
        style:{
            image:'/asset-hub/images/relevanceImages/'+option.status+'.png',
            width:iconSize,
            height:iconSize,
            opacity:1,
        }
    });

    var icon = new zrender.Image({
                   name:'icon',
                   draggable:true,
                   zlevel:2,
                   style:{
                       // image:'/asset-hub/images/relevanceImages/'+option.status+'/'+option.type+'.png',
                       image:'/asset-hub/images/relevanceImages/resource/'+ option.typeIcon + '.png',
                       width:24,
                       height:24,
                       opacity:1,
                       x:17,
                       y:17
                   }
    });

    var txt = new zrender.Text({
                    name:'txt',
                    draggable:true,
                    zlevel:2,
                    style:{
                        text:option.name,
                        textFill:'#BED1E7',
                        fontSize:14,
                        x:iconSize/2,
                        y:66,
                        textAlign:"center",
                        opacity:1
                    }
    });

    if (option.x > 0) {

        node.attr('position', [option.x, option.y]); //加载已经有的赋值

    }else{

        node.attr("position",[2000,0]); //拖进来之前
    }

    node.add(status);
    node.add(icon);
    node.add(txt);


    node.on('drag', function(e) {

          removeSector();

          var position =[e.event.offsetX-iconSize/2,e.event.offsetY-iconSize/2];
          for(var i=0;i<node.childCount();i++){
              var child =node.childAt(i);
              child.position=[0,0];
          }
          node.attr("position",position);
          renderLinkGroup();
    });

    node.on('dragend', function(e) {
        chosenobj = e.target.parent;
        var dataOption = node.data;
        if(dataOption.x != chosenobj.position[0] || dataOption.y != chosenobj.position[1]){
            dataOption.x = chosenobj.position[0];
            dataOption.y = chosenobj.position[1];
            sendNodeLinkInfoToBack([dataOption],null,0);
        }
    });

    node.on('mousedown', function(e) {
      log("node2 mousedown");
        if (linkbtn) { //如果是正在连线

            var option = {
                source:chosenobj,
                target:e.target.parent,
                // relationType:node.type,
                // relationName:node.relationName
            }
            log("可连");
            log("option.target.linkable:",option.target.linkable);

            if (option.target.linkable) {//可连
                //连线相关事件 鼠标链接节点 事件触发
                if(checkLineSame(option)){
                    zrCreateLineGroup(option);
                }
                linkbtn = false;
                closeLinkble();
                removeSector();
                if(node.isUp){
                    var link = {
                        source:e.target.parent.data.id,
                        target:chosenobj.data.id,
                        type : node.relation,
                        oneToN :node.oneToN
                    };
                } else {
                    var link = {
                        source:chosenobj.data.id,
                        target:e.target.parent.data.id,
                        type : node.relation,
                        oneToN :node.oneToN
                    };
                }
                sendNodeLinkInfoToBack(null,[link],1);
            } else {//不可连
                closeLinkble();
                // zr.remove(linelink);
                // zr.remove(sectorLink);
                // zr.remove(icon_link);
                removeSector();
                linkbtn = false;//初始化linkbtn  其为false的时候点击才会出现菜单
            }
        }else{
            chosenobj = e.target.parent;
            var option = {
                x:chosenobj.position[0],
                y:chosenobj.position[1]
            }
            showContrlBtns(option);
        }

    });

    return node;

}

function showContrlBtns(option){

        linelink.attr({
                    shape:{
                        x1:0,
                        y1:0,
                        x2:0,
                        y2:0,
                    }
        });

        sectorLink.attr({
                shape: {
                    r:sectorR0,
                    cx:option.x+iconSize/2,
                    cy:option.y+iconSize/2
                }
        });

        sectorDel.attr({
                shape: {
                    r:sectorR0,
                    cx:option.x+iconSize/2,
                    cy:option.y+iconSize/2
                }
        });

        sectorInfo.attr({
                shape: {
                    r:sectorR0,
                    cx:option.x+iconSize/2,
                    cy:option.y+iconSize/2
                }
        });

        sectorHelp.attr({
                shape: {
                    r:sectorR0,
                    cx:option.x+iconSize/2,
                    cy:option.y+iconSize/2
                }
        });

        icon_link.attr({
                style:{
                    opacity:0,
                    x:option.x+iconSize/2+23,
                    y:option.y+iconSize/2+23
                }
        });

        icon_del.attr({
                style:{
                    opacity:0,
                    x:option.x+iconSize/2-38,
                    y:option.y+iconSize/2+23
                }
        });

        icon_info.attr({
                style:{
                    opacity:0,
                    x:option.x+iconSize/2-38,
                    y:option.y+iconSize/2-38
                }
        });

        icon_help.attr({
                style:{
                    opacity:0,
                    x:option.x+iconSize/2+23,
                    y:option.y+iconSize/2-38
                }
        });


        //插入画布
        zr.add(sectorLink);
        zr.add(sectorDel);
        zr.add(sectorInfo);
        zr.add(sectorHelp);

        zr.add(icon_link);
        zr.add(icon_del);
        zr.add(icon_info);
        zr.add(icon_help);

        sectorLink.animateTo({
                shape:{
                    r:sectorR
                }
        }, sectorSpeed, sectorDelay, easing, function () {
                // done
        });


        sectorDel.animateTo({
                shape:{
                    r:sectorR
                }
        }, sectorSpeed, sectorDelay+200, easing, function () {
                // done
        });

        sectorInfo.animateTo({
                shape:{
                    r:sectorR
                }
        }, sectorSpeed, sectorDelay+400, easing, function () {
                // done
        });

        sectorHelp.animateTo({
                shape:{
                    r:sectorR
                }
        }, sectorSpeed, sectorDelay+600, easing, function () {
                // done
        });


        icon_link.animateTo({
                style:{
                    opacity:1
                }
        }, sectorSpeed, sectorDelay, easing, function () {
                // done
        });


        icon_del.animateTo({
                style:{
                    opacity:1
                }
        }, sectorSpeed, sectorDelay+200, easing, function () {
                // done
        });

        icon_info.animateTo({
                style:{
                   opacity:1
                }
        }, sectorSpeed, sectorDelay+400, easing, function () {
                // done
        });

        icon_help.animateTo({
                style:{
                   opacity:1
                }
        }, sectorSpeed, sectorDelay+600, easing, function () {
                // done
        });

}


//查重复的线
function checkLineSame(option){
    var noSameOne = true;
    var lineid = option.source.id+"_"+option.target.id
    if(links.length > 0){
         for (var i = 0; i < links.length; i++) {
            if ( links[i].id == lineid) {
                noSameOne = false;
            }
         }
    }
    return noSameOne;
}

function zrCreateLineGroup(option){

        var line = zrCreateLine(option);
        var label = zrCreatelabel(option);
        var arrow = zrCreateArrow(option);

        //将连线的type 与 name 绑定到line 对象中
        if (option.relationType && option.relationName) {
            line.relationType = option.relationType;
        }

        links.push(line);
        labels.push(label);
        arrows.push(arrow);
}


function drawAll(){

   zr.clear();

}

$(window).resize(function() {

    canvasW = $("#main").width();
    canvasH = $("#main").height();
    zr.resize();

});

function removeSector(){

     zr.remove(linelink);
     zr.remove(sectorLink);
     zr.remove(sectorDel);
     zr.remove(sectorInfo);
     zr.remove(sectorHelp);
     zr.remove(icon_link);
     zr.remove(icon_del);
     zr.remove(icon_info);
     zr.remove(icon_help);
}



// })();