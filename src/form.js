(function () {
    var Plugin, _renderFormWrap,
        _renderReadonlyFormStructure, _renderEditFormStructure, _sortModel, _getAttr, _bhFormDo, _renderTableFormStructure,
        _renderReadonlyInputPlace, _renderEditInputPlace, _eventBind, _calcLineHeight; //插件的私有方法
    var _defaultValues = {};

    Plugin = (function () {
        /**
         * @module bhForm
         * @alias 表单
         * @description 表单
         */
        function Plugin(element, options) {
            // 旧版 option 参数的兼容处理
            if (options.mode) {
                options.model = options.mode;
            }
            if (options.model == 'L' || options.model == 'horizontal') {
                options.model = 'h';
            }
            if (options.model == 'S' || options.model == 'vertical') {
                options.model = 'v';
            }
            if (options.rows) {
                options.cols = options.rows;
            }


            //将插件的默认参数及用户定义的参数合并到一个新的obj里
            this.options = $.extend({}, $.fn.bhForm.defaults, options);
            if (!this.options || this.options == null || this.options == "") {
                // this.options = WIS_EMAP_SERV.getContextPath();
            }
            //将dom jquery对象赋值给插件，方便后续调用
            this.$element = $(element);

            this.$element.attr("emap-role", "form");
            WIS_EMAP_INPUT.convertModel(options.data, 'form');

            _renderFormWrap(this.$element, this.options);
            //初始化控件
            if (this.options.data) {
                WIS_EMAP_INPUT.init(this.$element, this.options);
                // t表单需要在渲染完成后 兼容ie9的placeholder
                if (this.options.model === 't') {
                    WIS_EMAP_INPUT.placeHolder(this.$element);
                }
                if (!this.options.readonly) {
                    if (!$.isEmptyObject(_defaultValues)) WIS_EMAP_INPUT.formSetValue(this.$element, _defaultValues, this.options);
                    if (this.options.validate) {
                        // 初始化表单校验
                        this.$element.bhValidate({    
                            fieldModel: options.data
                        }); 
                    }  
                } 
            }
            if (!this.options.readonly && this.options.data) {
                // 初始化 下拉框联动
                var linkModal = getLinkageModel(this.options.data, this.options);
                if (linkModal.length > 0) {
                    this.$element.emapLinkage({
                        data: linkModal
                    });
                }
            }
            var self = this;

            _eventBind(this.$element, this.options);

            setTimeout(function () {
                // 针对某些特殊情况连续调用destroy后实例化 options可能为null时，做安全处理
                if (!self.options) {
                    return;
                }
                // 自动补齐
                if (self.options.readonly || self.options.model == 't') {
                    self.$element.bhForm('refreshColumns');
                }
                // ie9 添加placeholder
                WIS_EMAP_INPUT.placeHolder();

                // 表格表单 计算label行高, 文字过多时两行布局
                if (!options.flexLayout) {
                    _calcLineHeight(self.$element, self.options);
                }
            }, 0);
        }
        /**
         * @method disableItem
         * @description 禁用表单项
         * @param {String|Array} ids - 表单字段的name
         */
        Plugin.prototype.disableItem = function (ids) {
            var self = this.$element;
            WIS_EMAP_INPUT.formDisable(this.$element, ids);
            if (this.options.model == 't' && this.options.showDisableLockedIcon == true) {
                var element = this.$elemet;
                _bhFormDo(ids, function (id) {
                    $('[data-name=' + id + ']', element).closest('[emap-role="input-wrap"]').append('<i class="iconfont icon-lock bh-table-form-icon" style="background: #fff;"></i>')
                })
            }
            // 针对1.1， 1.2不同校验组件做兼容
            if (!self.data('bhvalidate')) {
                this.$element.bhForm('reloadValidate');
            } else {
                // 字段disable后， 尝试清除改字段上的校验出错信息
                self.bhValidate('hideValidate', ids);
            }
        };

        /**
         * @method enableItem
         * @description 启用表单项
         * @param {String|Array} ids - 表单字段的name
         */
        Plugin.prototype.enableItem = function (ids) {
            var self = this.$element;
            WIS_EMAP_INPUT.formEnable(this.$element, ids);
            if (this.options.model == 't' && this.options.showDisableLockedIcon == true) {
                var element = this.$elemet;
                _bhFormDo(ids, function (id) {
                    var lockIcon = $('[data-name=' + id + ']', element).closest('[emap-role="input-wrap"]').find('<i class="iconfont icon-lock bh-table-form-icon" style="background: #fff;"></i>');
                    if (lockIcon.length) lockIcon.remove();
                })
            }
            // 针对1.1， 1.2不同校验组件做兼容
            if (!self.data('bhvalidate')) {
                this.$element.bhForm('reloadValidate');
            }
        };

        /**
         * @method saveUpload
         * @description 保存表单中的上传组件 (请使用saveUploadSync代替)
         * @param {Object} [param] - 保存请求的附带参数
         */
        Plugin.prototype.saveUpload = function (param) {
            var items = $('[xtype=uploadphoto], [xtype=uploadfile], [xtype=uploadsingleimage], [xtype=uploadmuiltimage], [xtype="cache-upload"]', this.$element);
            if (items.length === 0) {
                // 表单中无上传组件的情况下调用保存上传方法
                console && console.error("There's no upload component in form, don't call the 'saveUploadSync' method !");
            } else {
                items.each(function () {
                    switch ($(this).attr('xtype')) {
                        case 'uploadphoto':
                            $(this).emapFilePhoto('saveTempFile', param);
                            break;
                        case 'uploadfile':
                            $(this).emapFileUpload('saveTempFile', param);
                            break;
                        case 'uploadsingleimage':
                            $(this).emapSingleImageUpload('saveTempFile', param);
                            break;
                        case 'uploadmuiltimage':
                            $(this).emapImageUpload('saveTempFile', param);
                            break;
                        case 'cache-upload':
                            $(this).emapUpload('saveUpload', param);
                            break;
                    }
                });
            }
        };

        /**
         * @method saveUploadSync
         * @description  异步的保存表单中上传组件的方法， 返回promise对象
         * @param {Object} params - 保存请求附带参数
         * @return {Object} 异步方法的Defer对象
         */
        Plugin.prototype.saveUploadSync = function (param) {
            var items = $('[xtype=uploadphoto], [xtype=uploadfile], [xtype=uploadsingleimage], [xtype=uploadmuiltimage], [xtype="cache-upload"]', this.$element);
            var items_length = items.length;
            var result_array = [];
            var result_defer = $.Deferred();
            result_defer.fail(function () { // 对于表单保存操作 中 上传文件保存操作失败的处理
                $.bhTip && $.bhTip({
                    content: '上传文件保存失败',
                    state: 'danger',
                    iconClass: 'icon-close'
                });
            });
            if (items_length === 0) {
                // 表单中无上传组件的情况下调用保存上传方法
                console && console.error("There's no upload component in form, don't call the 'saveUploadSync' method !");
                setTimeout(function () {
                    result_defer.resolve([]);
                }, 10);
            } else {
                items.each(function () {
                    var defer;
                    switch ($(this).attr('xtype')) {
                        case 'uploadfile':
                            defer = $(this).emapFileUpload('saveUpload', param);
                            break;
                        case 'uploadsingleimage':
                            defer = $(this).emapSingleImageUpload('saveUpload', param);
                            break;
                        case 'uploadmuiltimage':
                            defer = $(this).emapImageUpload('saveUpload', param);
                            break;
                        case 'cache-upload':
                            defer = $(this).emapUpload('saveUpload', param);
                            break;
                    }
                    defer.done(function (res) {
                        if (res.success) {
                            result_array.push(res);
                            if (result_array.length == items_length) {
                                result_defer.resolve(result_array);
                            }
                        } else {
                            result_defer.reject();
                        }
                    }).fail(function (error) {
                        result_defer.reject();
                    });
                });
            }

            return result_defer;
        };

        /**
         * @method showItem
         * @description 显示表单项
         * @param {String|Array} ids - 表单字段的name
         */
        Plugin.prototype.showItem = function (ids) {
            var self = this.$element;
            var options = this.options;
            _bhFormDo(ids, _show);
            // 针对1.1， 1.2不同校验组件做兼容
            if (!self.data('bhvalidate')) {
                this.$element.bhForm('reloadValidate');
            }
            if (options.model == 't' || options.readonly == true) {
                self.bhForm('refreshColumns')
            }

            function _show(id) {
                if (options.model == 't' || options.readonly === true) {
                    var item = $('[data-name=' + id + ']', self).closest('.bh-form-group');
                    item.show();
                    if (options.model == 't') {
                        item.parent().show();
                    }
                } else {
                    $('[data-name=' + id + ']', self).closest('.bh-row').show().attr('hidden', false);
                }
            }
        };

        /**
         * @method hideItem
         * @description 隐藏表单项
         * @param {String|Array} ids - 表单字段的name
         */
        Plugin.prototype.hideItem = function (ids) {
            var self = this.$element;
            var options = this.options;
            _bhFormDo(ids, _hide);
            // 针对1.1， 1.2不同校验组件做兼容
            if (!self.data('bhvalidate')) {
                this.$element.bhForm('reloadValidate');
            }
            if (options.model == 't' || options.readonly == true) {
                self.bhForm('refreshColumns')
            }

            function _hide(id) {
                if (options.model == 't' || options.readonly === true) {
                    var item = $('[data-name=' + id + ']', self).closest('.bh-form-group');
                    item.hide();
                    if (options.model == 't') {
                        item.parent().hide();
                    }
                } else {
                    $('[data-name=' + id + ']', self).closest('.bh-row').hide().attr('hidden', true);
                }
            }
        };

        /**
         * @method getValue
         * @description 表单取值
         * @return {Object} 包含表单每个字段的值的json对象， key为表单字段的name， value为表单字段的值
         */
        Plugin.prototype.getValue = function () {
            return WIS_EMAP_INPUT.formGetValue(this.$element, this.options);
        };

        /**
         * @method clear
         * @description 表单清空
         * @param {String|Array} - 如果不传参数，则清空表单中所有值;如果传入参数是个数组，则清空该数组中为字段名称的控件值 
         */
        Plugin.prototype.clear = function (val) {
            WIS_EMAP_INPUT.formClear(this.$element, val, this.options);
        };

        /**
         * @method setValue
         * @description 表单赋值
         * @param {Object} - 表单数据json对象， key为表单字段的name， value为表单字段的值
         */
        Plugin.prototype.setValue = function (val) {
            WIS_EMAP_INPUT.formSetValue(this.$element, val, this.options);
            // 表单塞值后清除出现的 校验信息
            var ids = [];
            if (val) {
                for (var v in val) {
                    ids.push(v);
                }
            }
            this.$element.bhForm('clearValidateInfo', ids);
        };


        /**
         * @method destroy
         * @description 销毁表单
         */
        Plugin.prototype.destroy = function () {
            // 遍历销毁单个控件 确保控件在body底部插入的dom元素被销毁
            $('[xtype]', this.$element).each(function () {
                var _this = $(this);
                var xtype = _this.attr('xtype');
                switch (xtype) {
                    case 'select':
                        _this.jqxDropDownList('destroy');
                        break;
                    case 'multi-select':
                        _this.jqxComboBox('destroy');
                        break;
                    case 'date-local':
                    case 'date-ym':
                    case 'date-full':
                        _this.jqxDateTimeInput('destroy');
                        break;
                    case 'tree':
                        _this.jqxDropDownButton('destroy');
                        break;
                }
            });
            if (!this.options.readonly) this.$element.emapValidate('destroy');
            this.options = null;
            $(this.$element).removeAttr("emap-role");
            $(this.$element).data('bhForm', false).empty();
        };

        /**
         * @method reloadValidate
         * @description 校验重载
         */
        Plugin.prototype.reloadValidate = function () {
            if (!this.options.validate) return;
            this.$element.emapValidate('destroy');
            this.$element.emapValidate(this.options);
        };

        /**
         * @method requireItem
         * @description 添加字段的必填校验
         * @param {String|Array} ids - 表单字段的name
         */
        Plugin.prototype.requireItem = function (ids) {
            var self = this.$element;
            _bhFormDo(ids, _required);

            function _required(id) {
                var $formGroup = $('[data-name=' + id + ']', self).closest('.bh-form-group');
                if (!$formGroup.hasClass('bh-required')) {
                    $formGroup.addClass('bh-required');
                    // 针对1.1， 1.2不同校验组件做兼容
                    if (self.data('bhvalidate')) {
                        // 1.2
                        self.bhValidate('requireItem', id);
                    } else {
                        // 1.1
                        self.bhForm('reloadValidate');
                    }
                }
            }
        };

        /**
         * @method unRequireItem
         * @description 取消字段的必填校验
         * @param {String|Array} ids - 表单字段的name
         */
        Plugin.prototype.unRequireItem = function (ids) {
            var self = this.$element;
            _bhFormDo(ids, _required);

            function _required(id) {
                var $formGroup = $('[data-name=' + id + ']', self).closest('.bh-form-group');
                if ($formGroup.hasClass('bh-required')) {
                    $formGroup.removeClass('bh-required');
                    // 针对1.1， 1.2不同校验组件做兼容
                    if (self.data('bhvalidate')) {
                        // 1.2
                        self.bhValidate('unRequireItem', id);
                    } else {
                        // 1.1
                        self.bhForm('reloadValidate');
                    }
                }
            }
        };

        /**
         * @method getModel
         * @description 获取表单模型
         * @param {Boolean} [sort=false] - 是否对表单模型按分组序列化
         * @return {Object} 表单模型
         */
        Plugin.prototype.getModel = function (sort) { // sort 是否自动分组
            if (this.options.hasGroup && sort) {
                return _sortModel(this.options.data);
            } else {
                return this.options.data;
            }
        };

        /**
         * @method refreshColumns
         * @description 刷新只读表单和表格表单的列布局  自动补齐
         */
        Plugin.prototype.refreshColumns = function () {
            var options = this.options;
            if (options.readonly || options.model == 't') {
                $('.bh-form-block', this.$element).each(function () {
                    if (options.model == 't') {
                        var groups = $('.bh-form-group:visible', $(this)).parent();
                    } else {
                        var groups = $('.bh-form-group:visible', $(this));
                    }

                    // 补齐重置
                    groups.each(function (i) {
                        groups[i].className = groups[i].className.replace(/bh\-col\-md\-\d+/g, 'bh-col-md-' + $(groups[i]).data('col') * options.colWidth);
                    });


                    var colCounter = 0;
                    groups.each(function (i) {
                        var col = $(this).data('col') * 1;
                        var cols = options.cols * 1;
                        colCounter += col;
                        //是否会换行
                        if (colCounter >= cols) {
                            //加上当前标签是否能占满整行，超出则调整上个标签宽度，使其占满一行的其余空间
                            if (colCounter % cols || col >= cols) {
                                //加上当前标签不能占满整行
                                if (colCounter % cols) {
                                    var lastCol = groups.eq(i - 1).data('col') * 1;
                                    //上一个标签宽度小于整行时，处理上一标签宽度
                                    if (lastCol < cols) {
                                        var newCol = cols - (colCounter - col - lastCol);
                                        groups[i - 1].className = groups[i - 1].className.replace(/bh\-col\-md\-\d+/g, 'bh-col-md-' + newCol * options.colWidth);
                                        colCounter = col;
                                    }
                                }
                                //当前标签是否超出一行，超出则占满整行
                                if (col >= cols) {
                                    groups[i].className = groups[i].className.replace(/bh\-col\-md\-\d+/g, 'bh-col-md-' + cols * options.colWidth);
                                    colCounter = 0;
                                }
                            } else {
                                colCounter = 0;
                            }
                        }
                        if (i === groups.length - 1) {
                            // 最后一项自动补齐
                            if (colCounter % cols) {
                                var newCol = cols - (colCounter - col);
                                // groups.eq(i).data('col', newCol);
                                groups[i].className = groups[i].className.replace(/bh\-col\-md\-\d+/g, 'bh-col-md-' + newCol * options.colWidth);
                                colCounter = 0;
                            }
                        }
                    });
                });
            }
        };

        /**
         * @method changeLabelColor
         * @description 不爱换表单字段label的背景色
         * @param {Object} [params] - json对象, key 为 颜色 可选值: 'primary', 'info', 'success', 'warning', 'danger' , 'normal',
         *  value 为要变换的 字段的name 可以为数组
         * @example
         *  $Form.bhForm('changeLabelColor', {
         *      primary: ['WID', 'XH'],
         *      success: ['XM']
         *  })
         */
        Plugin.prototype.changeLabelColor = function (params) {
            var instance = this;
            for (var k in params) {
                if (k != 'primary' && k != 'info' && k != 'success' && k != 'warning' && k != 'danger' && k != 'normal') {
                    console && console.error(k + '不是有效的label color 属性!');
                }
                if (params[k] instanceof Array) {
                    params[k].map(function (item) {
                        _handleColor(item, k, instance);
                    })
                } else {
                    _handleColor(params[k], k, instance);
                }
            }


            function _handleColor(name, color, instance) {
                var element = instance.$element;
                var type = instance.options.model;
                var form_group = $();
                if (type == 't' || instance.options.readonly == true) {
                    form_group = $('[data-name=' + name + ']', element).closest('.bh-form-group');
                } else if (type == 'h' || type == 'v') {
                    form_group = $('[data-name=' + name + ']', element).closest('.form-validate-block');
                }
                form_group.length && form_group.removeClass('bh-primary bh-info bh-success bh-warning bh-danger bh-normal').addClass('bh-' + color);
            }
        };

        /**
         * @method clearValidateInfo
         * @description 清除字段上的校验出错信息
         * @param {Array|String} [id] 字段id
         * @example
         * $form.bhForm('clearValidateInfo', 'WID');
         */
        Plugin.prototype.clearValidateInfo = function (id) {
            var element = this.$element;
            if (element.data('bhvalidate')) {
                element.bhValidate('hideValidate', id);
            } else {
                if (id === undefined) { // 清除表单中所有校验信息
                    element.jqxValidator('hide')
                } else if (id instanceof Array) { // 清除多个字段的校验信息
                    if (id.length) {
                        id.map(function (item) {
                            element.jqxValidator('hideHint', '[data-name=' + item + ']');
                        });
                    }
                } else if (typeof id == 'string') { // 清除单个字段的校验信息  
                    element.jqxValidator('hideHint', '[data-name=' + id + ']');
                }
            }

        }
        return Plugin;
    })();

    // 渲染表单外框
    _renderFormWrap = function (element, options) {
        if (!options.data) return; // 为兼容孟斌的特殊样式表单 此处实现表单的假实例化功能
        var readOnly = options.readonly ? options.readonly : false;
        var $form = $('<div class="bh-form-horizontal" bh-form-role="bhForm" ></div>');

        if (readOnly || options.model == "t") {
            $form.addClass('bh-form-readonly');
            if (options.model == "t") {
                $form.addClass('bh-table-form');
            }
            // 如果开启 flexLayout , 则采用flex布局
            if (options.flexLayout && document.documentMode != 9 && document.documentMode != 10) {
                $form.addClass('bh-flex-form');
            }
        } else {
            if (options.model == "v") {
                $form.addClass('bh-form-S');
            }
        }

        options.hasGroup = options.data.filter(function (val) {
            return !!val.groupName && val.groupName != "";
        }).length > 0;

        if (options.hasGroup && options.renderByGroup) {
            // 分组表单
            var sortedModel = _sortModel(options.data);
            for (var i = 0; i < sortedModel.length; i++) {

                // ui 要求 标题下边距高位24  表单区域下边距改为36
                var groupContainer = $('<div bh-form-role=groupContainer>' +
                    '<div class="bh-col-md-12 bh-form-groupname sc-title-borderLeft bh-mb-24"  title="' + sortedModel[i].groupName + '" >' +
                    '</div>' +
                    '<div class="bh-form-block bh-mb-36" bh-role-form-outline="container" style="margin-left: 12px;margin-bottom: 36px;"></div>' +
                    '</div>');

                if (options.showCollapseBtn) {
                    $('.bh-form-groupname', groupContainer).append(
                        '<span bh-role-form-outline="title">' + sortedModel[i].groupName + '</span>' +
                        '<a bh-form-role="collapseBtn" data-collapse=false class="bh-text-caption bh-mh-8" style="font-weight: normal;" href="javascript:void(0)">收起</a>'
                    );
                } else {
                    $('.bh-form-groupname', groupContainer).attr('bh-role-form-outline', 'title').append(sortedModel[i].groupName);
                }
                var formBlock = $('[bh-role-form-outline=container]', groupContainer);
                var visibleItem = sortedModel[i].items.filter(function (val) {
                    return !val.get('hidden');
                });
                if (!sortedModel[i].groupName || visibleItem.length == 0) {
                    // 隐藏未分组的字段
                    groupContainer.css('display', 'none');
                    $('.bh-form-groupname', groupContainer).removeAttr('bh-role-form-outline');
                    $('.bh-form-block', groupContainer).attr('bh-role-form-outline', 'hidden');
                }
                if (options.model == 't') {
                    // 表格表单
                    _renderTableFormStructure(formBlock, sortedModel[i].items, options);
                } else if (readOnly) {
                    _renderReadonlyFormStructure(formBlock, sortedModel[i].items, options);
                } else {
                    _renderEditFormStructure(formBlock, sortedModel[i].items, options);
                }
                $form.append(groupContainer);
            }
        } else {
            // 不分组表单
            if (options.model == 't') {
                // 表格表单
                _renderTableFormStructure($form, options.data, options);
            } else if (readOnly) {
                _renderReadonlyFormStructure($form, options.data, options);
            } else {
                _renderEditFormStructure($form, options.data, options);
            }
        }
        element.append($form);
    };

    // model 分组排序
    _sortModel = function (model) {
        var result = [];
        for (var i = 0; i < model.length; i++) {
            var groupItem = result.filter(function (val) {
                return val.groupName == model[i].groupName;
            });
            if (groupItem.length == 0) {
                result.push({
                    "groupName": model[i].groupName,
                    "items": [model[i]]
                });
            } else {
                groupItem[0].items.push(model[i]);
            }
        }
        return result;
    };

    // 渲染只读表单结构
    _renderReadonlyFormStructure = function (form, data, options) {
        options.cols = options.cols ? options.cols : 3;
        options.colWidth = 12 / options.cols;
        var formFragment = document.createDocumentFragment();
        var columnCounter = 0;
        // 计算出最后一个显示的字段的序号
        $(data).each(function (i) {
            var attr = _getAttr(this);
            if (!attr.hidden) {
                columnCounter += attr.col;
            }
            if (attr.xtype == 'textarea') {
                attr.col = 12 / options.colWidth;
            }
            var item = document.createElement('div');
            item.className = 'bh-form-group  bh-col-md-' + attr.col * options.colWidth;
            if (attr.hidden) item.style.display = 'none';
            item.setAttribute('data-col', attr.col);
            item.innerHTML += '<label class="bh-form-label bh-form-readonly-label bh-str-cut" title="' + attr.caption + '">' + attr.caption + '</label>';
            var form_input = document.createElement('div');
            form_input.className = 'bh-form-readonly-input';
            $(form_input).append(_renderReadonlyInputPlace(this, options));
            item.appendChild(form_input);
            formFragment.appendChild(item);

            // formFragment.appendChild('<div class="bh-form-group  bh-col-md-' + attr.col * options.colWidth + '" ' + (attr.hidden ? 'style="display: none;"' : '') + ' data-col="' + attr.col + '" >' +
            //     '<label class="bh-form-label bh-form-readonly-label bh-str-cut" title="' + attr.caption + '">' + attr.caption + '</label>' +
            //     '<div class="bh-form-readonly-input">' +
            //     _renderReadonlyInputPlace(this, options) +
            //     '</div></div>');


            // itemHtml += '<div class="bh-form-group  bh-col-md-' + attr.col * options.colWidth + '" ' + (attr.hidden ? 'style="display: none;"' : '') + ' data-col="' + attr.col + '" >' +
            //                 '<label class="bh-form-label bh-form-readonly-label bh-str-cut" title="' + attr.caption + '">' + attr.caption + '</label>' +
            //                 '<div class="bh-form-readonly-input">';
            // itemHtml += _renderReadonlyInputPlace(this, options);
            //     itemHtml += '</div>' +
            //             '</div>';

        });
        form.append(formFragment).addClass('bh-form-block');
    };
    // 渲染表格表单结构
    _renderTableFormStructure = function (form, data, options) {
        var itemArray = [];
        options.cols = options.cols ? options.cols : 3;
        options.colWidth = 12 / options.cols;

        $(data).each(function () {
            var itemHtml = '';
            var attr = _getAttr(this);
            if (attr.xtype == "textarea") attr.col = options.cols;
            itemHtml += '<div class="form-validate-block bh-col-md-' + attr.col * options.colWidth + '" data-col="' + attr.col + '" >' +
                '<div class="bh-form-group ' + attr.required + '" ' + (attr.hidden ? 'style="display: none;"' : '') + ' >' +
                '<label class="bh-form-label bh-form-readonly-label bh-str-cut" title="' + attr.caption + '">' + attr.caption + '</label>' +
                '<div class="bh-ph-8 bh-form-readonly-input" emap-role="input-wrap">';
            itemHtml += '<div class="bh-form-placeholder bh-form-flow">' + attr.placeholder + '</div>';
            itemHtml += '</div></div></div>';
            itemHtml = $(itemHtml);
            // 添加字段布局的最大高度为33px,防止在hover和校验出错时出现的边框导致高度增加而影响布局  仅在不占满一行的字段上生效 zhuhui 2016-07-16
            if (attr.col != options.cols && !options.flexLayout && $.inArray(attr.xtype, ['uploadfile', 'uploadsingleimage', 'uploadmuiltimage', 'cache-upload', 'direct-upload']) == -1) {
                itemHtml.css({
                    'max-height': '33px'
                });
            }
            if (options.flexLayout && attr.hidden) {
                itemHtml.css({
                    'display': 'none'
                })
            }
            var input_wrap = $('[emap-role="input-wrap"]', itemHtml);
            if (attr.inputReadonly) {
                // 只读字段
                input_wrap.append(_renderReadonlyInputPlace(this, options));
            } else {
                // 可编辑字段
                input_wrap.append(_renderEditInputPlace(this, true));
                if (attr.xtype == undefined || attr.xtype == 'text') {
                    // 为 文本框 添加右边的编辑图标
                    input_wrap.append('<i class="iconfont icon-edit bh-table-form-icon"></i>');
                }
            }
            itemArray.push(itemHtml);
        });
        form.append(itemArray).addClass('bh-form-block');
        $(".form-validate-block", form).hover(function () {
            $(this).addClass("bh-actived");
        }, function () {
            $(this).removeClass("bh-actived");
        });
    };

    // 渲染编辑表单结构
    _renderEditFormStructure = function (form, data, options) {
        $(data).each(function () {
            var attr = _getAttr(this);
            var rowHtml = "";
            var controlHtml = _renderEditInputPlace(this);
            var placeholderWidth = 12 - parseInt(options.inputWidth);

            if (options.model == 'h') {
                rowHtml = '<div class="bh-row form-validate-block" {{hidden}} data-field=' + attr.name + ' >' +
                    '<div class="bh-form-group bh-col-md-' + options.inputWidth + ' ' + attr.required + ' {{inputReadonly}}">' +
                    '<label class="bh-form-label bh-form-h-label bh-pull-left" title="' + attr.caption + '">' + attr.caption + '</label>' +
                    '<div class="bh-ph-8" style="margin-left: 115px;" emap-role="input-wrap">' +
                    // controlHtml +
                    '</div>' +
                    '</div>' +
                    '<div class="bh-form-group bh-col-md-' + placeholderWidth + ' bh-color-caption bh-form-placeholder">' + attr.placeholder + '</div>' +
                    '</div>';
            } else if (options.model == 'v') {
                rowHtml = '<div class="bh-row form-validate-block" {{hidden}} data-field=' + attr.name + '>' +
                    '<div class="bh-form-group bh-col-md-12 ' + attr.required + ' {{inputReadonly}}" style="padding: 0 4px 0 12px;">' +
                    '<label class="bh-form-label  ">' + attr.caption + '</label>' +
                    '<div class="bh-form-vertical-input-wrap" emap-role="input-wrap">' +
                    // controlHtml +
                    '</div>' +
                    '</div>' +
                    '<div class="bh-form-group bh-col-md-12 bh-color-caption bh-form-placeholder">' + attr.placeholder + '</div>' +
                    '</div>';
            }
            rowHtml = rowHtml.replace(/\{\{hidden\}\}/g, (attr.hidden ? 'style="display: none;" hidden=true' : ''))
            rowHtml = $(rowHtml);
            $('[emap-role="input-wrap"]', rowHtml).append(controlHtml);

            form.append(rowHtml);

            // 垂直可编辑表单的 开关 控件改为 左右布局
            if (options.model == 'v' && attr.xtype == 'switcher') {
                $('.bh-form-group', rowHtml).addClass('bh-form-vertical-switcher');
            }

            if (form.attr('bh-role-form-outline') != "hidden") {
                form.attr('bh-role-form-outline', 'container');
            }
        });
    };


    _renderReadonlyInputPlace = function (ele, options) {
        var itemHtml = '';
        var attr = _getAttr(ele);
        attr.xtype = attr.xtype || 'static';
        if (attr.xtype == "textarea") attr.col = options.cols;

        switch (attr.xtype) {
            case "uploadfile":
            case "uploadphoto":
            case "uploadsingleimage":
            case "uploadmuiltimage":
            case "cache-upload":
                itemHtml += '<div xtype="' + attr.xtype + '" class="bh-p-8" style="clear:none;min-height: 28px;" data-name="' + attr.name + '" data-disabled=true data-JSONParam="' + encodeURI(JSON.stringify(attr.JSONParam)) + '"></div>';
                break;
            case "textarea":
                itemHtml += '<textarea xtype="textarea" data-name="' + attr.name + '" class="bh-form-control" rows="3" maxlength="' + attr.dataSize + '" unselectable="on" readOnly  style="background: #fff;resize: none;border: none!important;box-shadow: none!important;overflow: auto;" ></textarea>';
                break;
            default:
                itemHtml += '<p data-name="' + attr.name + '" data-url="' + attr.url + '" xtype="' + attr.xtype + '" class="bh-form-static bh-ph-8"></p>';
        }

        return $(itemHtml).data('attr', attr);
    };

    _renderEditInputPlace = function (ele, showPlaceholder) {
        return WIS_EMAP_INPUT.renderPlaceHolder(ele, 'form', {
            showPlaceholder: showPlaceholder
        });
    };

    _getAttr = function (item) {
        var attr = WIS_EMAP_INPUT.getAttr(item);
        if (attr.defaultValue !== undefined) {
            _defaultValues[item.get("name")] = attr.defaultValue;
        }
        return attr;
    };

    _bhFormDo = function (ids, cb) {
        if ($.isArray(ids)) {
            ids.map(function (item) {
                cb(item);
            })
        } else {
            cb(ids);
        }
    };

    // 自动计算行高
    _calcLineHeight = function (element, options) {
        if (options.model == 't' || options.readonly == true) {
            $('.bh-form-readonly-label', element).each(function () {
                var h = $(this).height();
                var H = options.readonly ? '28px' : '30px';
                if (h > 30) {
                    $(this).css({
                        "line-height": "13px",
                        "max-height": H
                    });
                    if (h > 35) { // 超出两行显示 ...
                        $.bhCutStr({
                            dom: {
                                selector: $(this),
                                line: 2
                            }
                        })
                    }
                }
            });
        }
    };

    _eventBind = function (element, options) {
        var formWrap = $('[bh-form-role="bhForm"]', element);
        // 分组项 的展开收起
        formWrap.on('click', '[bh-form-role="collapseBtn"]', function () {
            var self = $(this);
            var formBlock = $(this).closest('[bh-form-role="groupContainer"]').find('.bh-form-block');
            if (self.data('collapse')) {
                formBlock.slideDown(200, function () {
                    // WIS_EMAP_SERV._resetPageFooter();
                });
                self.data('collapse', false).text('收起');
            } else {
                formBlock.slideUp(200, function () {
                    //  WIS_EMAP_SERV._resetPageFooter();
                });
                self.data('collapse', true).text('展开');
            }
        });
    };

    // 表单高级联动配置转换
    function getLinkageModel(model, options) {
        return WIS_EMAP_INPUT.cloneObj(model).filter(function (item) {
            var linkage = [];
            if (item.linkage && typeof item.linkage === 'string') {
                try {
                    item.linkage = JSON.parse(item.linkage.replace(/\'/g, '"'))
                } catch (e) {
                    console && console.error('无效的linkage参数格式，必须是对象数组或序列化的字符串')
                }
            }
            if (item.linkageBy || item['form.linkageBy']) {
                linkage.push({
                    type: 'data',
                    linkageBy: item['form.linkageBy'] || item.linkageBy,
                    linkageName: item['form.linkageName'] || item.linkageName
                })
            }
            if (options.linkage && options.linkage[item.name]) {
                linkage = linkage.concat(options.linkage[item.name])
            }
            if (linkage.length) {
                item.linkage = linkage;
            }
            return !!item.linkage
        })
    }

    $.fn.bhForm = function (options, params) {
        var instance;
        instance = this.data('bhForm');
        if (!instance) {
            return this.each(function () {
                if (options == 'destroy') {
                    return this;
                }
                return $(this).data('bhForm', new Plugin(this, options));
            });
        }
        if (options === true) return instance;
        if ($.type(options) === 'string') return instance[options](params);
        return this;
    };

    /**
     * @memberof module:bhForm
     * @prop {Object} data - 表单数据模型
     * @prop {String}  [root] - emap根路径
     * @prop {Boolean} [readonly=false] - 是否只读，<b>注意readonly为true时，不能和 model=t参数同时使用</b>
     * @prop {Sring} [model=h] - 表单布局方式 可选值 'h' 水平布局  'v'' 垂直布局  't' 表格布局 ; 只在非只读表单中生效
     * @prop {Int} [cols=3] - 表单布局列数，只在只读表单和表格表单中生效，可选值  1 2 3
     * @prop {Boolean} [validate=true] - 是否开启表单校验
     * @prop {Boolean} [renderByGroup=true] - 在模型中有分组的情况下，是否按照分组进行渲染
     * @prop {Boolean} [autoColumn=true] - 只读表单和表格表单列宽是否自动补齐
     * @prop {Int} [inputWidth=6] - 水平布局表单，表单控件所占宽度 可选1-12
     * @prop {Object} [defaultOptions] - 控件默认配置参数， 是针对表单中的相同类型控件批量设置的参数，如给所有的单选下拉框统一设置开启搜索功能
      $('#form').bhForm({
         data: data,
         defaultOptions: {
           select: {
               search: true
           }
         }
      })
      若需要给单独字段设置额外配置参数，请在模型的JSONParam中实现
     * @prop {Object} [itemOptions] - 控制指定字段的参数
     * @prop {Boolean} [showCollapseBtn=false] - 分组表单是否显示 展开收起按钮
     * @prop {Boolean} [showDisableLockedIcon=false] - 表格表单 disable 项 控件右侧是否展示 小锁icon
     * @prop {Boolean} [flexLayout=false] - 只读表单和表格表单是否启用flex布局，**此选项ie9 ie10不兼容**
     */
    $.fn.bhForm.defaults = {
        readonly: false, // 是否只读
        model: 'h', // 编辑表单样式  h  v
        cols: '3', // 只读表单 列数
        root: "", // emap根路径
        validate: true, // 是否开启校验
        renderByGroup: true, // 按照分组渲染表单
        autoColumn: true, // 只读表单列宽自动补齐
        inputWidth: '6', // 水平表单 表单控件所占列数  默认6  最高12
        showCollapseBtn: false, // 分组表单是否显示 展开收起按钮
        showDisableLockedIcon: false, // 表格表单 disable 项 控件右侧是否展示 小锁icon
        flexLayout: false
    };
}).call(this);