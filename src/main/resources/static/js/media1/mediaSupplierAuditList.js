var url = baseUrl + "/mediaAudit";


//全局参数定义
var fileUpload;
var companyMap = null; //缓存公司
var mediaTermMap = {}; //缓存板块对应的媒体查询条件，结构：{plateId: {fromId: formObj}}
var supplierExtendMap = {}; //唤醒板块是否有对应供应商扩展字段，结构：{plateId: bool}
var mediaUserMap = {};//缓存媒介用户
var mediaTermULDefaultHTML = ""; //缓存默认条件html
var mediaUserPlateMap= [];//用户板块集合
$(function () {
    $.jgrid.defaults.styleUI = 'Bootstrap';
    $(window).bind('resize', function () {
		var tableElement = $("#table_medias");
		var width = tableElement.closest('.jqGrid_wrapper').width() || $(document).width();
		tableElement.setGridWidth(width);

		var supplierPriceNode = $("#mediaSupplierPriceTable");
		supplierPriceNode.setGridWidth(supplierPriceNode.closest('.jqGrid_wrapper').width());
        // var width = $('.jqGrid_wrapper').width();
        // $('#table_medias').setGridWidth(width);

    });

	//更多点击事件
	$("#more").click(function () {
		var iNode = $("#more > i:eq(1)");
		var classStr = iNode.attr('class');
		if(classStr.indexOf("fa-chevron-up") != -1){ //当前其他条件为隐藏
			iNode.removeClass("fa-chevron-up");
			iNode.addClass("fa-chevron-down");
			$("#otherCondition").fadeIn("slow");
		}else{
			iNode.removeClass("fa-chevron-down");
			iNode.addClass("fa-chevron-up");
			$("#otherCondition").fadeOut("slow");
		}
	});

	loadAllMediaMJ($("#userName"));//加载责任人，然后保存默认页面
	loadCopyCondition();//加载启用和拷贝查询条件
	mediaTermULDefaultHTML = $("#mediaTermUL").html();
	initMediaType(); //加载板块
    queryUserMediaPlateIds();//查询当前用户的媒体板块id
});

/**
 * 后台请求方法
 * @param data 请求数据
 * @param url 请求路径
 * @param requestType 请求方式
 * @param dataType 数据类型
 * @param async是否异步
 * @param callBackFun 成功回调方法
 */
var requestData = function (data, url, requestType,dataType,async,callBackFun) {
	$.ajax({
		type: requestType,
		url: baseUrl + url,
		data: data,
		dataType: dataType,
		async: async,
		success: callBackFun
	});
}

//加载责任人
function loadAllMediaMJ(t){
	requestData(null,"/user/listByType/MJ","get","json",false,function (data) {
		$(data).each(function (i, d) {
			var value = $(t).attr("data-value");
			var selected = value == d.id ? "selected=selected" : "";
			$(t).append("<option value='" + d.id + "' " + selected + ">" + d.name + "</option>");
			mediaUserMap[d.id] = d;
		});
	})
}

//加载启用和拷贝查询条件
function loadCopyCondition() {
	//是否启用
	$("#enabledDiv").html("        <span class=\"radio-inline col-md-1 i-checks\" title=\"不限\"><input type=\"radio\" name=\"enabled\" value=\"\"/>不限</span>\n" +
		"                            <span class=\"radio-inline col-md-1 i-checks\" title=\"启用\"><input type=\"radio\" name=\"enabled\" value=\"0\"/>启用</span>\n" +
		"                            <span class=\"radio-inline col-md-1 i-checks\" title=\"停用\"><input type=\"radio\" name=\"enabled\" value=\"1\"/>停用</span>");

	//是否拷贝，只给祥和员工看
	/*if("XH" == user.dept.companyCode){
		$("#copyDiv").css("display","block");
		$("#isCopyDiv").html("<span class=\"radio-inline col-md-1 i-checks\" title=\"不限\"><input type=\"radio\" name=\"isCopy\" value=\"\"/>不限</span>\n" +
			"                            <span class=\"radio-inline col-md-1 i-checks\" title=\"启用\"><input type=\"radio\" name=\"isCopy\" value=\"0\"/>自建</span>\n" +
			"                            <span class=\"radio-inline col-md-1 i-checks\" title=\"停用\"><input type=\"radio\" name=\"isCopy\" value=\"1\"/>拷贝</span>");
	}else{
		$("#copyDiv").css("display","none");
	}*/
}

//查询当前用户的媒体板块id
function queryUserMediaPlateIds() {
    $.ajax({
        url: baseUrl + "/mediaPlate/userId",
        data: {"userId": user.id},
        type: "post",
        dataType: "json",
        success: function (data) {
            if (data) {
                for (var i = 0; i < data.length; i++) {
                    mediaUserPlateMap.push(data[i].id);
                }
            }
        }
    });
}

//加载媒体板块
function initMediaType() {
	requestData(null,"/mediaPlate/userId","get","json",false, function (data) {
		if (data == null || data == '') {
			swal("没有板块可操作！", "没有查询到板块信息，请联系管理员赋权！", "warning");
			return;
		}
		requestData(null,"/mediaAudit/getMediaSupplierNumbers/1","get","json",false,function (mediaTotal) {
			var mediaTotalMap = {};
			$.each(mediaTotal.data.data, function (i,value) {
				mediaTotalMap[value.plateId] = value.mediaTotal;
			});
			var standardHtml = "";
			var notStandardHtml = "";
			var mcount = 0;
			$(data).each(function (i, item) {
				mcount = mediaTotalMap[item.id];
				mcount = mcount ? mcount : 0;
				//标准平台不需要审核不展示
				if (item.standarPlatformFlag != 1) {
					notStandardHtml += "<div style='width: 10%;float: left;'><span style='white-space: nowrap;text-overflow: ellipsis;overflow: hidden;width: 100%;' class='btn btn-outline plateSpan' title='" + item.name + "' data-standarPlatformFlag='" + item.standarPlatformFlag + "' data-mcount='" + mcount + "' data-value='" + item.id + "' onclick='setType(" + item.id + ",this)'>" + item.name + "(" + mcount + ")" + "</span></div>";
				}
			});
			//判断标准和非标准是否有，控制隐藏显示
			if (standardHtml) {
				$("#extendFormStandardPlateWrap").css("display", "flex");
				$("#extendFormStandardPlate").html(standardHtml);
			} else {
				$("#extendFormStandardPlateWrap").css("display", "none");
				$("#extendFormStandardPlate").html("");
			}
			if (notStandardHtml) {
				$("#extendFormNotStandardPlateWrap").css("display", "flex");
				$("#extendFormNotStandardPlate").html(notStandardHtml);
			} else {
				$("#extendFormNotStandardPlateWrap").css("display", "none");
				$("#extendFormNotStandardPlate").html("");
			}
			var type = getQueryString("type");
			if (type && type === '2') {
				$("#mediaPlate span[data-value='" + type + "']").click();
			} else {
				$("#mediaPlate>div:first-child>span:first-child").click();

				//如果标准有值，则先查询标准的
				if (standardHtml) {
					$("#extendFormStandardPlate > div:first-child > span:first-child").click();
				} else {
					if (notStandardHtml) {
						$("#extendFormNotStandardPlate > div:first-child > span:first-child").click();
					}
				}
			}
		});
	});
	// createTable(); //初始化表格
}

//表格定义
function createTable() {
	var termForm = $("#termForm").serializeJson();
	var $tableMedias = $("#table_medias");
	$tableMedias.jqGrid({//2600
		url: baseUrl + '/mediaAudit/listAuditMediaSupplier',
		datatype: "json",
		postData: termForm,
		mtype: 'get',
		altRows: true,
		altclass: 'bgColor',
		height: "auto",
		page: 1,//第一页
		rownumbers: true,
		setLabel: "序号",
		autowidth: true,//自动匹配宽度
		gridview: true, //加速显示
		cellsubmit: "clientArray",
		viewrecords: true,  //显示总记录数
		multiselectWidth: 25, //设置多选列宽度
		sortorder: "desc", //排序方式：倒序，本例中设置默认按id倒序排序
		sortable: true,
		sortname: "id",
		multiselect: true,
		shrinkToFit: true,
		prmNames: {rows: "size"},
		rowNum: 10,//每页显示记录数
		rowList: [10, 50, 100],//分页选项，可以下拉选择每页显示记录数
		jsonReader: {
			root: "list", page: "pageNum", total: "pages",
			records: "total", repeatitems: false, id: "relateId"
		},
		prmNames: {
			page: "page",
			rows: "size",
			totalrows: "totalElements",
			sort: "sort",
			order: "order",
		},
		colModel: [
			{
				name: 'id',
				label: 'id',
				editable: true,
				hidden: true,
				sortable: true,
				sorttype: "int",
				search: true
			},
			{
				name: 'relateId',
				label: 'relateId',
				hidden: true
			},
			// {
			// 	name: 'picPath',
			// 	label: '媒体图标',
			// 	editable: true,
			// 	width: 20,
			// 	align: "center",
			// 	formatter: function (v, options, row) {
			// 		if (!v){
			// 			return '<img class="head-img" src="/img/mrt.png"/>';
			// 		}else{
			// 			return '<img class="head-img" src="' + v + '" onerror="src=\'/img/mrt.png\'"/>';
			// 		}
			// 	}
			// },
			{
				name: 'mediaName',
				label: '媒体名称',
				editable: true,
				width: 30,
				align: "center",
				hidden: true,
				formatter: function (v, options, row) {
					return row.name;
				}
			},
			{
				name: 'name',
				label: '媒体名称',
				editable: true,
				width: 30,
				align: "center"
				// formatter: function (v, options, row) {
				// 	if (!row.link){
				// 		return v;
				// 	}else{
				// 		return "<a class='text-success' target='_blank' href='" + row.link + "'>" + v + "</a>";
				// 	}
				// }
			},
			{
				name: 'mediaContentId',
				label: '唯一标识',
				editable: true,
				width: 30,
				align: "center",
			},
            {
                name: 'link',
                label: '媒体链接',
                editable: true,
                width: 30,
                align: "center",
                formatter: function (v, options, row) {
                    if (!row.link){
                        return v;
                    }else{
                        return "<a class='text-success' target='_blank' href='" + row.link + "'>" + v + "</a>";
                    }
                }
            },
			{
				name: 'supplierCompanyName',
				label: '供应商公司名称',
				editable: true,
				width: 20,
				align: "center",
				formatter: function (v, options, row) {
					if(row.mediaPriceCellList && row.mediaPriceCellList.length > 0){
						return row.mediaPriceCellList[0].supplierCompanyName;
					}
				}
			},
			{
				name: 'supplierName',
				label: '供应商联系人',
				editable: true,
				width: 20,
				align: "center",
				formatter: function (v, options, row) {
					if(row.mediaPriceCellList && row.mediaPriceCellList.length > 0){
						return row.mediaPriceCellList[0].supplierName;
					}
				}
			},
            {
                name: 'supplierPhone',
                label: '供应商电话',
                editable: true,
                width: 30,
                align: "center",
                formatter: function (value, grid, rows) {
                    if(rows.mediaPriceCellList && rows.mediaPriceCellList.length > 0){
                        var flag = false;
                        value = rows.mediaPriceCellList[0].supplierPhone;
                        var plateIds="";
                        if(rows.mediaPriceCellList[0].plateIds!=null){
                            plateIds = rows.mediaPriceCellList[0].plateIds.split(",");//供应商对应的媒体板块id
                        }
                        var creator = rows.mediaPriceCellList[0].supplierCreator;//供应商负责人
                        if (plateIds) {
                            for (var i = 0; i < plateIds.length; i++) {
                                if (mediaUserPlateMap.contains(plateIds[i])) {
                                    //当前用户的板块包含了该供应商的板块
                                    flag = true;
                                }
                            }
                        }
                        //1、仅责任人自己能看到   或者拥有板块的 组、部 、 总监
                        if ((user.id == creator) || (flag && rows.mediaPriceCellList[0].flag)) {
                            return value || '';
                        } else {
                            if (value.length >= 11) {
                                var start = value.length > 11 ? "*****" : "****";
                                return value.substring(0, 3) + start + value.substring(value.length - 4, value.length);
                            } else if (value.length >= 3) {
                                return value[0] + "***" + value[value.length - 1];
                            } else {
                                return "**";
                            }
                        }
                    }else{
                        return "";
                    }
                }
            },
			{
				name: 'regionId',
				label: 'regionId',
				editable: true,
				hidden: true,
				sortable: true,
				sorttype: "int",
				search: true
			},
			{
				name: 'plateId',
				label: 'plateId',
				editable: true,
				hidden: true,
				sortable: true,
				sorttype: "int",
				search: true
			},
			// {
			// 	name: 'discount',
			// 	label: '折扣率',
			// 	width: 20,
			// 	align: "center",
			// 	formatter: function (v, options, row) {
			// 		return v ? v + " %" : "100%";
			// 	}
			// },
			{
				name: 'userId',
				label: '责任人',
				width: 12,
				align: "center",
				hidden: true
			},
			{
				name: 'user.userName',
				label: '责任人',
				width: 12,
				align: "center",
				hidden: false
			},
			{
				name: 'updateDate',
				label: '更新时间',
				width: 20,
				align: "center",
				formatter: "date",
				formatoptions: {srcformat: 'Y-m-d H:i:s', newformat: 'Y-m-d'},
				hidden: true
			},
			{
				name: 'enabled',
				label: '是否启用',
				width: 12,
				align: "center",
				hidden: false,
				formatter: function (v, options, row) {
					if(row.mediaPriceCellList && row.mediaPriceCellList.length > 0){
						if(row.mediaPriceCellList[0].enabled == 0){
							return "<span style='color: green;'>启用</span>";
						}else{
							return "<span style='color: red;'>停用</span>";
						}
					}
				}
			},
			{
				name: 'isCopy',
				label: '是否拷贝',
				width: 12,
				align: "center",
				hidden:true,//user.dept.companyCode == 'XH' ? false : true,
				formatter: function (v, options, row) {
					if(row.mediaPriceCellList && row.mediaPriceCellList.length > 0){
						if(row.mediaPriceCellList[0].isCopy == 1){
							return "拷贝";
						}else{
							return "自建";
						}
					}
				}
			},
			{
				name: 'companyCode',
				label: '所属公司',
				width: 12,
				align: "center",
				hidden: true
			},
			// {
			// 	name: 'companyCodeName',
			// 	label: '所属公司',
			// 	width: 12,
			// 	align: "center",
			// 	hidden: false
			// },
			{
				label: "供应商价格",
				name: 'priceExt',
				editable: true,
				sortable: true,
				width: 40,
				align: "left",
				hidden: true,
				formatter: function (v, options, row) {
					var html = "";
					var j = 1;
					//将底价也加进来
					// html += "<div class='col-md-12' style='text-align:center;padding: 0'><span >底价</span>:<span class='text-danger font-bold'>￥"+ row.price+"</span></div><br/>";
					var val = row.mediaPriceCellList;
					$(val).each(function (i, item) {
						var align = j % 2 == 0 ? "right" : "left";
						if (item.cellType == "price" && item.cellValue && item.cellValue != 0) {
							/*<input data-value='" + item.cellValue + "' data-id='" + row.id + "' onclick='fixContainerObj.clickPriceExt(" + row.id + "," + item.id + ")' type='radio' value='" + item.id + "' class='i-checks' name='price" + row.id + "' />*/
							html += "<div class='col-md-12' style='text-align:center;padding: 0'><span >" + item.cellName + "</span>:<span class='text-danger font-bold'>￥"+ parseFloat(item.cellValue).toFixed(2)+"</span></div>";
							if (j++ % 1 == 0) {
								html += "<br/>";
							}
						}
					});
					return html;
				}
			},
			{
				label: "供应商扩展",
				name: 'supplierExt',
				editable: true,
				sortable: true,
				width: 50,
				align: "left",
				hidden: false,
				formatter: function (v, options, row) {
					var html = "";
					var j = 1;
					$(row.mediaPriceCellList).each(function (i, item) {
						if (item.cellType != 'price') {
							var text = "无";
							if(item.cellValue){
								if(item.cellType == 'select' || item.cellType == 'radio' || item.cellType == 'checkbox'){
									text = item.cellValueText;
								}else{
									text = item.cellValue;
								}
							}
							if(item.cellType == 'link' && "无" != text){
								html += "<div class='col-md-6' style='text-align:left;padding: 0;padding-right: 5px;'><span style='float:left' >" + item.cellName + ":</span><a class='text-success' style='float:left' target='_blank' href='"+text+"'>进入链接</a></div>";
							}else{
								html += "<div class='col-md-6' style='text-align:left;padding: 0;padding-right: 5px;'><span style='float:left' >" + item.cellName + ":</span><span class='text-danger' style='float:left'  >" + text + "</span></div>";
							}
							if (j++ % 2 == 0) {
								html += "<br/>";
							}
						}
					});
					return html;
				}
			},
			{
				label: "媒体扩展",
				name: 'mediaExtends',
				width: 50,
				align: "left",
				formatter: function (v, options, row) {
					var html = "";
					var j = 1;
					$(v).each(function (i, item) {
						if (item.type != 'price') {
							var value = item.cellValue;
							var text = "无";
							if(item.cellValue){
								if(item.dbType == 'select' || item.dbType == 'radio' || item.dbType == 'checkbox'){
									text = item.cellValueText;
								}else{
									text = item.cellValue;
								}
							}
							if(item.type == 'link' && "无" != text){
								html += "<div class='col-md-6' style='text-align:left;padding: 0;padding-right: 5px;'><span style='float:left' >" + item.cellName + ":</span><a class='text-success' style='float:left' target='_blank' href='"+text+"'>进入链接</a></div>";
							}else{
								html += "<div class='col-md-6' style='text-align:left;padding: 0;padding-right: 5px;'><span style='float:left' >" + item.cellName + ":</span><span class='text-danger' style='float:left'  >" + text + "</span></div>";
							}
							if (j++ % 2 == 0) {
								html += "<br/>";
							}
						}
					});
					return html;
				}
			},
			{
				name: 'state1',
				label: '关系审核状态',
				width: 12,
				align: "center",
				hidden: true,
				formatter: function (v, options, row) {
					if(row.mediaPriceCellList && row.mediaPriceCellList.length > 0){
						return row.mediaPriceCellList[0].supplierRelateState;
					}
				}
			},
			{
				name: 'state',
				label: "审核状态",
				editable: true,
				sortable: true,
				hidden: false,
				width: 12,
				align: "center",
				formatter: function (v, options, row) {
					if(row.mediaPriceCellList && row.mediaPriceCellList.length > 0){
						switch (row.mediaPriceCellList[0].supplierRelateState) {
							case 0:
								return '<span class="text-muted">未审核</span>';
							case 1:
								return '<span class="text-success">已通过</span>';
							case -1:
								return '<span class="text-danger">已驳回</span>';
							case -9:
								return '<span class="text-justify">已删除</span>';
						}
					}
				}
			},
			/*{
				name: 'remarks',
				label: '备注',
				editable: true,
				width: 25,
				align: "center",
				hidden: false
			},*/
			{
				name: 'copyRemarks',
				label: '拷贝备注',
				editable: true,
				width: 15,
				align: "center",
				hidden:true,//user.dept.companyCode == 'XH' ? false : true,
				formatter: function (v, options, row) {
					if(row.mediaPriceCellList && row.mediaPriceCellList.length > 0){
						return row.mediaPriceCellList[0].copyRemarks;
					}
				}
			},
			{
				label: "操作",
				width: 30,
				hidden: false,
				formatter: function (v, options, row) {
					//祥和部长和组长可以审核媒体关系
					var html = "";
					if(row.mediaPriceCellList && row.mediaPriceCellList.length > 0){
						html +=  "&nbsp;<a class='text-success' onclick='audit(\"passRelate\"," + row.id + "," + row.relateId + ",\""+row.companyCode+"\")'>通过</a>&nbsp;" +
							"<a class='text-danger' onclick='audit(\"rejectRelate\"," + row.id + "," + row.relateId + ",\""+row.companyCode+"\")'>驳回</a>&nbsp;";
					}
					html += "<a class='text-success' onclick='mediaSupplierChangeObj.mediaSupplierChangeShow("+row.relateId+","+row.userId+");'>异动详情</a>";
					return html;
				}
			},
		],
		pager: "#pager_medias",
		viewrecords: true,
		caption: "媒体关系列表",
		hidegrid: false,
		loadComplete: function (data) {
			if (getResCode(data))
				return;
			var isPrice;
			$(data.list).each(function (i, item) {
				if (item.type == 'price') isPrice = true;
			});
			if (isPrice) {
				$(this).setGridParam().hideCol("priceExt");
			} else {
				$(this).setGridParam().showCol("priceExt");
			}
		},
		gridComplete: function () {
			var width = $('#table_medias').closest('.jqGrid_wrapper').width() || $(document).width();
			$('#table_medias').setGridWidth(width);

			var plateId = $("#plateId").val();
			var $plateNode = $("#mediaPlate span[data-value='"+plateId+"']");
			var mediaNum = $("#table_medias").jqGrid("getGridParam","records");
			$plateNode.attr("data-mcount",mediaNum);
			$plateNode.text($plateNode.attr("title")+"("+mediaNum+")");
			$("#mediaTypeText").text($plateNode.text());
		}
	});
	$tableMedias.jqGrid('setLabel', 'rn', '序号', {'text-align': 'center'}, '');
	$tableMedias.setSelection(4, true);
	var width = $tableMedias.closest('.jqGrid_wrapper').width() || $(document).width();
	$tableMedias.setGridWidth(width);
}

//刷新表格
function reflushTable() {
	//标准平台获取唯一标识值
	if($("#standarPlatformFlag").val() && $("#standarPlatformFlag").val() == 1){
		$("#mediaContentId").val($("#standarPlatformId").val());
	}else {
		$("#mediaContentId").val("");
	}
	$("#mediaName").val($("#mName").val()); //媒体名称
	$("#supplierName").val($("#contactName").val()); //供应商名称
	var json = $("#termForm").serializeJson();
	var condition = {};
	for (var k in json) {
		if (k.indexOf("cell:") > -1) {
			var value = json[k];
			var kk = k.substring(5, k.length);
			var arr = kk.split(":");
			var length = arr.length; //2-代表不是区间的数，3-自定义栏的区间数值（最后一个是min: 开始值，max：结束值）
			var cell = arr[0];
			var type = arr[1];
			var k3 = null;
			if(length == 3){
				k3 = arr[2];//该值为min 或 max
			}
			if(type == "checkbox" && Array.isArray(value)){ //如果是数组，则转成字符串
				value = value.join(",");
			}
			//由于区间的cell相同，所以cellValueStart 和 cellValueEnd需要放在同一个对象中
			if(!condition[cell]){
				if(k3 && k3 == 'min'){
					condition[cell] = {cell:cell, type:type, cellValueStart:value};
				}else if(k3 && k3 == 'max'){
					condition[cell] = {cell:cell, type:type, cellValueEnd:value};
				}else{
					condition[cell] = {cell:cell, type:type, cellValue:value};
				}
			}else{
				if(k3 && k3 == 'min'){
					condition[cell].cellValueStart = value;
				}else if(k3 && k3 == 'max'){
					condition[cell].cellValueEnd = value;
				}else{
					condition[cell].cellValue = value;
				}
			}
			delete json[k];
		}else if(k == 'wechatId'){
			condition[cell] = {cell:'wechatId', type:'text', cellValue:json[k], wechatIdFlag: 1};
			delete json[k];
		}else if(k == 'ksId'){
			condition[cell] = {cell:'ksId', type:'text', cellValue:json[k], ksIdFlag: 1};
			delete json[k];
		}

	}
	var extendArr = new Array();
	if(condition && Object.getOwnPropertyNames(condition).length > 0){
		for(var key in condition){
			extendArr.push(condition[key]);
		}
	}
	json.extendParams = JSON.stringify(extendArr);


	//刷新表格
	$("#table_medias").emptyGridParam(); //清空历史查询数据
	//根据板块ID判断是否显示案例链接还是ID字段
	var colModels = $("#table_medias").jqGrid('getGridParam', 'colModel');
	$(colModels).each(function (j, colModel) {
		if (colModel.name == "mediaContentId") {
			if($("#standarPlatformFlag").val() && $("#standarPlatformFlag").val() == 1){
				$("#table_medias").setGridParam().showCol(colModel.name);
			}else {
				$("#table_medias").setGridParam().hideCol(colModel.name);
			}
		}
		if(colModel.name == 'supplierExt'){
			if(supplierExtendMap[json.plateId]){
				$("#table_medias").setGridParam().showCol(colModel.name);
			}else {
				$("#table_medias").setGridParam().hideCol(colModel.name);
			}
		}
	});
	$("#table_medias").jqGrid('setGridParam', {
		postData: json, //发送数据
	}).trigger("reloadGrid"); //重新载入
}

function setType(id, t) {
	var standarPlatformFlag = $(t).attr("data-standarPlatformFlag") || 0;
	var backColor = standarPlatformFlag == 1 ? "btn-primary" : "btn-danger";
	$(t).closest(".plateWrap").find(".plateSpan").each(function (i, item) {
		$(item).removeClass("btn-primary");
		$(item).removeClass("btn-danger");
		if (t == item) {
			$(t).addClass(backColor);
		}
	});

	$("#standarPlatformFlag").val($(t).attr("data-standarPlatformFlag") || 0);//设置是否平台标准
	$("#mediaTypeText").text($(t).text());
	$("#mediaTypeText").attr("title",$(t).attr("title"));
	$("#plateId").val(id);
	$("#mediaName").val('');//初始化媒体名称
	$("#mName").val(''); //初始化媒体名称
	$("#supplierName").val('');//初始化供应商名称
	$("#contactName").val(''); //初始化供应商名称
	$("#enabled").val('');//初始化是否启用
	$("#isCopy").val('');//初始化是否拷贝
	$("#userId").val('');  //初始化责任人
	// 清空之后动态加载的查询条件；
	$("#plateId").nextAll().remove();

	//如果是标准平台，唯一标识搜索
	if($("#standarPlatformFlag").val() && $("#standarPlatformFlag").val() == 1){
		$("#standarPlatformId").css("display","inline-block");
	}else{
		$("#standarPlatformId").css("display","none");
	}

	$("#mediaTermUL").html(mediaTermULDefaultHTML);//每次选媒体板块，重新覆盖

	//所属公司
/*	if(!companyMap){
		requestData(null,"/dept/listAllCompany","get","json",false,function (data) {
			companyMap = data.data.result;
			renderCompany(companyMap);
		});
	}else {
		renderCompany(companyMap);
	}*/
	//扩展表单，判断当前板块是否有扩展字段
	if(!supplierExtendMap[id]){
		requestData(null,"/mediaForm1/" + id,"get","json",false,function (formDatas) {
			if(formDatas && formDatas.length > 0){
				for(var z = 0; z < formDatas.length; z++){
					if(formDatas[z].extendFlag == 1){
						supplierExtendMap[id] = true;
						break;
					}
				}
			}
		});
	}

	//查询条件
	if(!mediaTermMap[id]){
		requestData(null,"/mediaTerm1/" + id,"get","json",false,function (datas) {
			mediaTermMap[id] = datas; //缓存媒体查询条件
			renderPageCondition(datas);//渲染页面条件
		});
	}else{
		renderPageCondition(mediaTermMap[id]);//渲染页面条件
	}

	createTable(); //重新加载表格
	reflushTable();//刷新表格

	$('.i-checks').iCheck({
		checkboxClass: 'icheckbox_square-green',
		radioClass: 'iradio_square-green',
	});

	layui.use('form', function(){
		layui.form.render('select');//layui重新渲染下拉列表
	});
}

//所属公司
/*function renderCompany(data) {
	var dd="''";
	var html = '<span class="col-md-1"><span class="text-danger bg-danger" style="padding: 5px" onClick="setCompanyType('+dd+',this)">不限</span></span>';
	$(data).each(function (i, item) {
		html += " <span class=\"col-md-1\"><span class=\"\" style=\"padding: 5px\" onclick='setCompanyType(\""+item.code+"\",this)'>"+item.name+"</span></span>";
	})
	$("#companyType").html(html);
}*/

//重新渲染页面条件
function renderPageCondition(datas) {
	var html = '';
	var priceHtml = '';//缓存金额和数字范围HTML
	$(datas).each(function (i, data) {
		var data = data;
		var cellName = data.cellName;
		var cell = "cell:" + data.cell + ":" + data.type;
		switch (data.type) {
			case 'radio':
			case 'checkbox':
				html += "<li class='col-md-12'><label class=\"col-md-1\" style='float:left;'>";
				html += cellName + '：</label><div class="col-md-11" style="padding-left: 15px;">';
				var dataClass = data.type == "radio" ? "radio-inline" : "checkbox-inline";
				var dbHtml = "";
				if(data.dbJson){  //如果dbJson字段有值则使用，否为dbsql有值
					var json = eval(data.dbJson);
					if (!Array.isArray(json)){
						json = [json];
					}
					$.each(json, function (i, item) {
						var text = item.hasOwnProperty("text") ? item.text : item.value;
						dbHtml += "<span class='"+dataClass+" col-md-1 i-checks' title='"+text+"' style=''><input id=\"${name}\" name=\"${name}\" cell-name=\"${cell-name}\" type='"+data.type+"' value='" + item.value + "' /> " + text + "</span>";
					});
				}else{
					var datas = data.datas;
					if (datas && Object.getOwnPropertyNames(datas).length > 0) {  //如果对象存在，并且个数大于0
						for(var key in datas){
							dbHtml += "<span  class='"+dataClass+" col-md-1 i-checks' title='"+datas[key].name+"'><input id=\"${name}\" name=\"${name}\" cell-name=\"${cell-name}\" type='"+data.type+"' value='" + datas[key].id + "' /> " + datas[key].name + "</span>";
						}
					}
				}
				html += dbHtml;
				html += "</div></li>"

				break;
			case 'select':
				html += "<li class='col-md-12'><label class=\"col-md-1\" style='float:left;'>";
				html += cellName + '：</label><div class="col-md-11" style="padding: 0">';
				var dd="''";
				var dbHtml = '<span class="col-md-1" title="不限"><span class="text-danger bg-danger" style="padding: 5px" onclick="loadMedia(\''+cell+'\','+dd+',this)">不限</span></span>';
				if(data.dbJson){  //如果dbJson字段有值则使用，否为dbsql有值
					var json = eval(data.dbJson);
					if (!Array.isArray(json)){
						json = [json];
					}
					$.each(json, function (i, item) {
						var text = item.hasOwnProperty("text") ? item.text : item.value;
						dbHtml += '<span class="col-md-1" title="'+text+'"><span class="" style="padding: 5px" onclick="loadMedia(\''+cell+'\','+item.value+',this)">'+text+'</span></span>';
					});
				}else{
					var datas = data.datas;
					if (datas && datas.length > 0) {  //如果对象存在，并且个数大于0
						for(var key in datas){
							dbHtml += '<span class="col-md-1" title="'+datas[key].name+'"><span class="" style="padding: 5px" onclick="loadMedia(\''+cell+'\','+datas[key].id+',this)">'+datas[key].name+'</span></span>';
						}
					}
				}
				html += dbHtml;
				html += "</div></li>"
				break;
			case 'price':
			case 'number':
				var nameMin = cell + ":min";
				var nameMax = cell + ":max";
				priceHtml += "<span class=\"col-md-3 form-inline\">\n" +
				"             	<input name=\"${nameMin}\" size=\"1\" cell-name=\"${cell-name}\" class=\"form-control\">" +
                "              -<input name=\"${nameMax}\" size=\"1\" cell-name=\"${cell-name}\" class=\"form-control\">&nbsp;\n" +
				"               <label class=\"btn btn-sm btn-danger\">"+cellName+"</label>\n" +
				"             </span>";
				priceHtml = priceHtml.th("nameMin",nameMin).th("nameMax",nameMax);
				break;
			default:
				html += "<li class='col-md-12'><label class=\"col-md-1\" style='float:left;'>";
				html += cellName + ':</label><div class="col-md-11" style="padding: 0">';
				html += data.dbHtml;
				html += "</div></li>";
				break;
		}
		html = html.th('id', cell).th('name', cell).th('labelName', cellName).th('type', data.type).th("cell-name", cellName);
		priceHtml = priceHtml.th('id', cell).th('name', cell).th('labelName', cellName).th('type', data.type).th("cell-name", cellName);
	});
	//循环结束后，添加价格区间
	if(priceHtml){
		html += "<li class='col-md-12'><label class=\"col-md-1\" style='float:left;'> 自定义栏：</label><div class=\"col-md-11\" style='padding: 0px;'>";
		/*html += "<span class=\"col-md-3 form-inline\">\n" +
			"             	<input name=\"priceStart\" size=\"1\" cell-name=\"priceStart\" class=\"form-control\">" +
			"              -<input name=\"priceEnd\" size=\"1\" cell-name=\"priceEnd\" class=\"form-control\">&nbsp;\n" +
			"               <label class=\"btn btn-sm btn-danger\">底价</label>\n" +
			"             </span>";*/
		html += priceHtml;
		html += "<span class=\"col-md-3 form-inline\"><label class=\"btn btn-sm btn-success\" onclick=\"loadMediaData(this);\">查询</label></span>";
		html += "</div></li>";
	}

	$("#mediaTermUL").html($("#mediaTermUL").html() + html); //在公共查询条件后面追加
	// 调整样式为居左对齐；
	$(".col-md-12 > label").css({"text-align": "left", "width": "120px", "margin": "0px", "padding": "0px"});
	$(".col-md-11 > span").css({"text-align": "left"});

	//单选和复选框添加选中事件
	$("#mediaTermUL").find('.i-checks').on('ifClicked', function (event) {
		var input = $(this).find("input");
		if(input.attr("name") != 'enabled' && input.attr("name") != 'isCopy' ){
			loadMedia(input.attr("name"), input.val(), input);
		}else{
			if(input.attr("name") != 'isCopy'){
				$("#enabled").val(input.val());//初始化是否启用
			}else{
				$("#isCopy").val(input.val());//初始化是否拷贝
			}
			reflushTable();
		}
	});
}

//根据公司查询
function setCompanyType(code,t){
	$(t).parent().parent().parent().find("div>span>span").each(function (i, item) {
		if (t == item) {
			if($(item).hasClass("text-danger")){ //如果是页面点击span，则再次点击移除
				$(item).removeClass("text-danger bg-danger");
				$(item).parent().siblings(":first").find("span").addClass("text-danger bg-danger");
				code = "";
			}else{
				$(item).removeClass("text-danger bg-danger");
				$(t).addClass("text-danger bg-danger");
			}
		}else{
			$(item).removeClass("text-danger bg-danger");
		}
	});
	$("#companyCode").val(code);
	reflushTable();
}

//加载查询条件
function loadMedia(name, value, target) {
	//判断是否有值，有值则重新添加
	if(value){
		if ($(target)[0].tagName.toLowerCase() == 'span') { //如果是页面点击span，则再次点击移除
			$("#termForm > input[name='" + name + "']").remove(); // 先删除原有的同name条件；
			if($(target).hasClass("text-danger")){ //如果已经是点击状态，则再次点击取消该条件
				$(target).removeClass("text-danger bg-danger");
				$(target).parent().siblings(":first").find("span").addClass("text-danger bg-danger");
			}else{
				$(target).parent().parent().find("span").removeClass("text-danger bg-danger");
				$(target).addClass("text-danger bg-danger");
				var input = "<input type='hidden' name='" + name + "' value='" + value + "'/>";
				$("#termForm").append(input);
			}
		}else if($(target)[0].tagName.toLowerCase() == 'input' && $(target).attr("type") == "checkbox"){
			if(!$(target).parent().hasClass("checked")){  //判断是否已被选中，未被选中，新增
				var input = "<input type='hidden' name='" + name + "' value='" + value + "'/>";
				$("#termForm").append(input);
			}else{
				$("#termForm input[name='"+name+"']").each(function (i,node) {
					if($(node).val() == value){
						$(node).remove();
					}
				})
			}
		}else{
			$("#termForm > input[name='" + name + "']").remove(); // 先删除原有的同name条件；
			var input = "<input type='hidden' name='" + name + "' value='" + value + "'/>";
			$("#termForm").append(input);
		}
	}else{
		// 先删除原有的同name条件；
		$("#termForm > input[name='" + name + "']").remove();
		$(target).parent().parent().find("span").removeClass("text-danger bg-danger");
		$(target).addClass("text-danger bg-danger");
	}
	reflushTable();
}

// 自定义栏的查询方法；
function loadMediaData(obj) {
	$(obj).closest("div").find("input").each(function () {
		//底价特别处理
		if($(this).attr("name") == "priceStart" || $(this).attr("name") == "priceEnd"){
			$("#termForm #"+$(this).attr("name")).val($(this).val());
		} else {
			// 先移除；
			$("#termForm > input[name='" + $(this).attr("name") + "']").remove();
			// 如果有值则存储；
			if ($(this).val().length > 0) {
				$("#termForm").append($(this).clone());
			}
		}
	});
	reflushTable();
}

//审核操作，审核媒体关系
function audit(type, mediaId, relateId, mediaCompanyCode) {
	var companyCode = user.dept.companyCode; //当前用户公司代码
	var opName = type == "passRelate" ? "审核通过" : "驳回"; //操作名称
	if(companyCode != mediaCompanyCode){
		swal({
			title: "很抱歉，媒体关系操作失败！",
			text: "只有该媒体所在公司媒介才能" + opName,
			type: "warning",
			html: true
		});
		return;
	}
	requestData({mediaId:mediaId, relateId:relateId},"/mediaAudit/" + type, "get", "json", true,function (data) {
		if (data.code == 200) {
			layer.msg("成功");

			reflushTable();//刷新表格
			triggerPageBtnClick("/media1/mediaList","mediaListSearchBtn"); //触发媒体管理Tab刷新
			triggerPageBtnClick("/media1/mediaSupplierList","mediaListSearchBtn"); //触发媒体管理Tab刷新
		} else {
			if (getResCode(data)) {
				return;
			}else{
				swal({
					title: "很抱歉，媒体关系操作失败！",
					text: data.msg,
					type: "error",
					html: true
				});
			}
		}
	});
}

//批量操作，媒体关系
function auditOprate(obj, flag) {
	var companyCode = user.dept.companyCode; //当前用户公司代码
	var opName = "操作"; //操作名称
	var url = "";
	var tips = "";
	// 通过；
	if (flag == 0) {
		url = "/mediaAudit/passBatchRelate";
		tips = "确认批量通过?";
		opName = "审核通过";
	}
	// 驳回；
	if (flag == 1) {
		url = "/mediaAudit/rejectBatchRelate";
		tips = "确认批量驳回?";
		opName = "驳回";
	}
	// 删除；
	if (flag == 2) {
		url = "/mediaAudit/deleteBatchRelate";
		tips = "确认批量删除?";
		opName = "删除";
	}
	var info = new Array();  //缓存当前不能操作的
	var ids = $("#table_medias").jqGrid("getGridParam", "selarrrow");
	if (url.length > 0 && ids.length > 0) {
		// 获取选中列的数据；
		var mediaNames = new Array();
		var userIds = new Array();
		var relateIds = new Array(); //媒体关系ID
		var mediaIds = new Array(); //媒体ID
		var mediaSupplierRelates = new Array(); //媒体关系，批量删除使用
		$(ids).each(function (index, id) {
			//由id获得对应数据行
			var row = $("#table_medias").jqGrid('getRowData', id);
			if(row.companyCode != companyCode){
				info.push("<span style=\"color: brown;font-size: 12px;\">很抱歉，存在["+row.mediaName+"]不能"+opName+"，只有该媒体所在公司媒介才能"+opName+"！</span>")
				ids.splice(0,1); //从数据中删除当前ID
			}else{
				mediaNames.push(row.mediaName);
				userIds.push(row.userId);
				mediaIds.push(row.id);
				relateIds.push(row.relateId);
				mediaSupplierRelates.push(row.id+"-"+row.supplierId);
			}
		});
		layer.confirm(tips, {
			btn: ["确认", "取消"],
			shade: false
		}, function (index) {
			layer.close(index);
			layer.msg("系统处理中，请稍候。");
			startModal("#" + $(obj).attr("id"));
			if(ids.length > 0){
				var param = { mediaIds: mediaIds, mediaNames: mediaNames, userIds: userIds,relateIds:relateIds };
				if(flag == 2){
					param.mediaSupplierRelates = mediaSupplierRelates;
				}
				requestData(param, baseUrl + url, "get","json",true,function (data) {
					Ladda.stopAll();
					if (data.code == 200) {
						layer.msg("成功");
						triggerPageBtnClick("/media1/mediaList","mediaListSearchBtn"); //触发媒体管理Tab刷新
						triggerPageBtnClick("/media1/mediaSupplierList","mediaListSearchBtn"); //触发媒体管理Tab刷新
					} else {
						if (getResCode(data)) {
							return;
						}else{
							swal({
								title: "很抱歉，媒体关系操作失败！",
								text: data.msg,
								type: "error",
								html: true
							});
						}
					}
					// 刷新数据；
					reflushTable();
				});
			}else{
				var text = "";
				if(info.length > 0){
					text +=  info.join("<br/>");
				}
				swal({
					title: "请选择您可操作的数据",
					text: text,
					type: "warning",
					html: true
				});
				Ladda.stopAll();
			}
		}, function () {
			return;
		})
	} else {
		layer.msg("请选择要操作的数据。");
	}
}

//媒体供应商异动详情
var mediaSupplierChangeObj = {
	mediaSupplierCommonFieldList:[
		{cellCode:"enabled",cellName:"是否可用"},
		{cellCode:"isDelete",cellName:"是否删除"},
	],//媒体公共字段
	mediaSupplierExtendMap:{},//媒体扩展字段缓存
	mediaSupplierChangeList:[],//缓存媒体异动列表
	chooseMediaSupplierChangeId: null,//选中的异动ID
	chooseMediaSupplierChangeOp: null,//选中的异动操作，对于新增的媒体，不让恢复，让他自己去删除
	renderMediaSupplierField:function (layero, plateId, mediaSupplierExtendList) {
		var html = "";
		$.each(mediaSupplierChangeObj.mediaSupplierCommonFieldList, function (i, extend) {
			html += "<div class=\"fieldItem\" title=\""+extend.cellName+"\" onclick='mediaSupplierChangeObj.renderMediaSupplierChange(this, \""+extend.cellCode+"\");'>\n" +
				"        <div class=\"ellipsisContent\">"+extend.cellName+"</div>\n" +
				"    </div>";
		});
		if(mediaSupplierExtendList && mediaSupplierExtendList.length > 0){
			$.each(mediaSupplierExtendList, function (i, extend) {
				//展示仅供应商使用 和 仅媒体的价格
				if(extend.extendFlag == 1 || extend.type == 'price'){
					html += "<div class=\"fieldItem\" title=\""+extend.cellName+"\" onclick='mediaSupplierChangeObj.renderMediaSupplierChange(this, \""+extend.cellCode+"\");'>\n" +
						"        <div class=\"ellipsisContent\">"+extend.cellName+"</div>\n" +
						"    </div>";
				}
			});
		}
		$(layero[0]).find(".fieldItemWrap").html(html);
	},
	renderMediaSupplierChangeLi:function (cellCode, mediaSupplierChange) {
		var moreBtnHtml = "";
		var firstRowHtml = "";
		var otherRowHtml = "";
		var returnFlag = false;//返回标识，判断是否返回数据，默认返回空，如果cellCode有值，需要判断变更字段中是否包含该字段，没包含则返回空
		var changeContent = JSON.parse(mediaSupplierChange["changeContent"])["change"];
		//多个更改字段才有更多按钮
		if(changeContent["fieldList"] &&　changeContent["fieldList"].length > 0){
			moreBtnHtml = "<div class=\"moreChangeBtn\" onclick=\"mediaSupplierChangeObj.moreBtnClick(this);\">\n" +
				"                  <i class=\"text-danger\">更多&nbsp;</i>\n" +
				"                  <i class=\"fa fa-chevron-up\"></i>\n" +
				"              </div>";
			$.each(changeContent["fieldList"], function (i, fieldChange) {
				//如果cellCode有值，需要判断变更字段中是否包含该字段，没包含则返回空，cellCode为空时返回
				if(!cellCode || (cellCode && fieldChange.cell == cellCode)){
					returnFlag = true;
				}
				//责任人
				if("userId" == fieldChange.cell){
					fieldChange.oldCellValue = fieldChange.oldCellValue ? (mediaUserMap[fieldChange.oldCellValue] ? mediaUserMap[fieldChange.oldCellValue].name : fieldChange.oldCellValue): "空";
					fieldChange.newCellValue = fieldChange.newCellValue ? (mediaUserMap[fieldChange.newCellValue] ? mediaUserMap[fieldChange.newCellValue].name : fieldChange.newCellValue): "空";
				}
				//没有选择字段 或者  选择字段等于该字段，第一行显示字段
				if((!cellCode && i == 0) || (cellCode && fieldChange.cell == cellCode)){
					firstRowHtml = "<div class=\"firstRowItemWrap\" title='"+((fieldChange.oldCellText || fieldChange.oldCellValue) || '空')+"->"+((fieldChange.newCellText || fieldChange.newCellValue) || '空')+"'>\n" +
						"               <div class=\"fieldName\" title='"+fieldChange.cellName+"'>"+fieldChange.cellName+"</div>\n" +
						"               <div class=\"fieldChangeVal\">\n" +
						"                   <span class=\"oldValue\">："+((fieldChange.oldCellText || fieldChange.oldCellValue) || '空')+"</span>\n" +
						"                   <span>-></span>\n" +
						"                   <span class=\"newValue\">"+((fieldChange.newCellText || fieldChange.newCellValue) || '空')+"</span>\n" +
						"               </div>\n" +
						"           </div>";
				}else {
					otherRowHtml += "<div class=\"otherRowItem\" title='"+((fieldChange.oldCellText || fieldChange.oldCellValue) || '空')+"->"+((fieldChange.newCellText || fieldChange.newCellValue) || '空')+"'>\n" +
						"               <div class=\"fieldName\" title='"+fieldChange.cellName+"'>"+fieldChange.cellName+"</div>\n" +
						"               <div class=\"fieldChangeVal\">\n" +
						"                   <span class=\"oldValue\">："+((fieldChange.oldCellText || fieldChange.oldCellValue) || '空')+"</span>\n" +
						"                   <span>-></span>\n" +
						"                   <span class=\"newValue\">"+((fieldChange.newCellText || fieldChange.newCellValue) || '空')+"</span>\n" +
						"               </div>\n" +
						"           </div>";
				}
			});
		}
		var titleTmp = mediaSupplierChange.mediaName + "-"+changeContent.opDesc+"（"+mediaSupplierChange.createDate+"）";
		var html = "<li class=\"layui-timeline-item timeLineCss\">\n" +
			"           <i class=\"layui-icon layui-timeline-axis\">&#xe63f;</i>\n" +
			"           <div class=\"layui-timeline-content layui-text timeCss\">\n" +
			"               <div class=\"layui-timeline-title\" style=\"display: flex;justify-content: space-between;padding-right: 20px;\">\n" +
			"                   <div title='"+titleTmp+"' style='width: 70%;white-space: nowrap;text-overflow: ellipsis;overflow: hidden;'>"+titleTmp+"</div>\n" +
			"                   <div>异动人："+mediaUserMap[mediaSupplierChange.userId].name+"&nbsp;&nbsp;&nbsp;&nbsp;审核人："+mediaSupplierChange.auditUserName+"</div>\n" +
			"               </div>" +
			"               <div class=\"timeContent\" onclick='mediaSupplierChangeObj.recoverClick(this, "+mediaSupplierChange.id+", \""+changeContent.op+"\");'>\n" +
			"                   <div class=\"firstRowContentWrap\">\n" +
			"                       "+firstRowHtml+"\n" +
			"                       "+moreBtnHtml+"\n" +
			"                   </div>\n" +
			"                   <div class=\"otherRowContentWrap\">\n" +
			"                       "+otherRowHtml+"\n" +
			"                   </div>\n" +
			"               </div>\n" +
			"           </div>\n" +
			"       </li>";

		if(returnFlag){
			return html;
		}else {
			return "";
		}
	},
	renderMediaSupplierChange:function (t, cellCode) {
		//如果有值，则说明是点击某个字段则改变字体颜色
		if(cellCode){
			$(t).closest(".fieldItemWrap").find(".fieldItem").removeClass("fieldItemActive");
			$(t).addClass("fieldItemActive");
		}
		var html = "";
		if(mediaSupplierChangeObj.mediaSupplierChangeList && mediaSupplierChangeObj.mediaSupplierChangeList.length > 0){
			$.each(mediaSupplierChangeObj.mediaSupplierChangeList, function (i, mediaSupplierChange) {
				html += mediaSupplierChangeObj.renderMediaSupplierChangeLi(cellCode, mediaSupplierChange);
			});
		}
		$(t).closest(".modalContentWrap").find("#announcements").html(html);
	},
	mediaSupplierChangeShow: function (relateIds, userId) {
		layer.open({
			type: 1,
			title: '媒体供应商异动详情',
			content: $("#mediaChange").html(),
			btn: ['取消'],
			area: ["55%", "80%"],
			shade: 0,
			shadeClose: true,
			resize: false,
			move: '.layui-layer-title',
			moveOut: true,
			success: function (layero, index) {
				var plateId = $("#plateId").val();

				//修改字段名称
				$(layero[0]).find(".fieldLabel").text("供应商全部字段");
				//绑定事件
				$(layero[0]).find(".fieldLabel").click(function () {
					mediaSupplierChangeObj.renderMediaSupplierChange(this);
				});


				//获取媒体扩展字段
				if(!mediaSupplierChangeObj.mediaSupplierExtendMap[plateId] || mediaSupplierChangeObj.mediaSupplierExtendMap[plateId].length < 1){
					requestData(null, "/mediaAudit/listMediaField/"+plateId, "post", "json", false, function (data) {
						mediaSupplierChangeObj.mediaSupplierExtendMap[plateId] = data;
					});
				}
				mediaSupplierChangeObj.renderMediaSupplierField(layero, plateId, mediaSupplierChangeObj.mediaSupplierExtendMap[plateId]);//渲染字段
				requestData({relateIds:relateIds}, "/mediaAudit/listMediaSupplierChange", "post", "json", true, function (data) {
					mediaSupplierChangeObj.mediaSupplierChangeList = data;
					mediaSupplierChangeObj.renderMediaSupplierChange($(layero[0]).find("#announcements"));
				});
			},
		});
	},
	moreBtnClick: function (t) {
		var iNode = $(t).find("i:eq(1)");
		var classStr = iNode.attr('class');
		if(classStr.indexOf("fa-chevron-up") != -1){ //当前其他条件为隐藏
			iNode.removeClass("fa-chevron-up");
			iNode.addClass("fa-chevron-down");
			$(t).closest(".timeContent").find(".otherRowContentWrap").fadeIn("slow");
		}else{
			iNode.removeClass("fa-chevron-down");
			iNode.addClass("fa-chevron-up");
			$(t).closest(".timeContent").find(".otherRowContentWrap").fadeOut("slow");
		}
	},
	recoverClick:function (t, id, op) {
		var $announcements = $(t).closest("#announcements");
		if($(t).hasClass("timeContentActive")){
			$(t).removeClass("timeContentActive");
			mediaSupplierChangeObj.chooseMediaSupplierChangeId = null;//再次点击移除选中
			mediaSupplierChangeObj.chooseMediaSupplierChangeOp = null;
		}else {
			//移除其他选中的
			$announcements.find(".timeContent").removeClass("timeContentActive");
			$(t).addClass("timeContentActive");
			mediaSupplierChangeObj.chooseMediaSupplierChangeId = id;//点击选中
			mediaSupplierChangeObj.chooseMediaSupplierChangeOp = op;
		}
	}
}