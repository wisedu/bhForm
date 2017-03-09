(function () {
    var Plugin;
    /**
     * @module bhValidate
     * @alias 表单校验
     * @description 校验组件，已在emapForm中集成
     * 
     * 配置说明： 
     * <br>必填校验 - 在模型中配置字段的require
     * <br>长度校验 - 优先取模型配置的checkSize作为校验长度，如果没有checkSize，则取dataSize作为校验长度，其中 日期控件（date-*）和开关控件（switcher）不做长度校验
     * <br>类型校验 - 对应模型中配置的checkType, 指定校验规则库中的校验规则，如 money
     * <br>正则校验 - 对应模型中的checkExp
     * <br>联动校验 - 在模型中的checkType中配置，规则为 【规则名称】@【联动字段name】,如： before@CSRQ, 同时兼容之前的custom[xxx]写法，但不建议继续使用
     * @example 
     * $container.bhValidate({
     *     fieldModel: dataModel
     * })  
     */
    Plugin = (function () {
        function Plugin(element, options) {
            this.options = $.extend({}, $.fn.bhValidate.defaults, options);
            this.$element = $(element);
            this.options.focusFlag = false;
            _init(this.$element, this.options);
        }

        /**
         * @method destroy
         * @description 销毁
         */
        Plugin.prototype.destroy = function () {
            this.options = null;
            $(this.$element).data('bhvalidate', false);
        };

        /**
         * @method validate
         * @description 校验
         * @param {String|Array} [name] - 指定字段名称， 不传则全部校验
         * @return {Boolean} 校验结果
         * @example
         * $container.bhValidate('validate');
         */
        Plugin.prototype.validate = function (name) {
            if (!name) {
                return validateAction(this.$element, this.options, undefined, true);
            } else if (typeof name === 'string') {
                return validateItem($('[data-name=' + name + ']', this.$element), this.options, true);
            } else if (name instanceof Array) {
                var result = true;
                var element = this.$element;
                name.map(function (item) {
                    if (!validateItem($('[data-name=' + item + ']', element), this.options, true)) {
                        result = false;
                    }
                });
                return result;
            }
        };

        /**
         * @method addValidateMsg
         * @description 添加一个字段的校验出错信息，此方法不会对字段进行校验
         * @param {String} name - 字段名
         * @param {String} msg - 校验信息
         * @example
         * $container.bhValidate('addValidateMsg', name, msg);
         */
        Plugin.prototype.addValidateMsg = function (name, msg) {
            this.options.validateView.showValidate($('[data-name=' + name + ']', this.$element), msg);
        };
        /**
         * @method hideValidate 
         * @description 移除字段的校验出错信息
         * @param {String|Array} [name] - 指定的字段名称，不传则全部隐藏
         */
        Plugin.prototype.hideValidate = function (name) {
            var element = this.$element;
            var options = this.options;
            if (!name) {
                $('[xtype]', element).each(function () {
                    options.validateView.hideValidate($(this));
                })
            } else if (name instanceof Array) {
                name.map(function (item) {
                    options.validateView.hideValidate($('[data-name=' + item + ']', element));
                });
            } else if (typeof name === 'string') {
                options.validateView.hideValidate($('[data-name=' + name + ']', element));
            }
        };

        /**
         * @method editValidateCondition
         * @description 编辑校验条件
         * @param {Function} cb -  处理校验条件的回调，参数为validateConditions， element， options, 函数必须返回 validateConditions
         */
        Plugin.prototype.editValidateCondition = function (cb) {
            if (typeof cb === 'function') {
                this.options.validateConditions = cb(this.options.validateConditions, this.$element, this.options);
            } else {
                console && console.error('editValidateCondition 方法传参必须为 function');
            }
        };

        /**
         * @method requireItem
         * @description 设置指定字段的必填校验
         * @param {String|Array} name - 字段的name，可以为数组
         */
        Plugin.prototype.requireItem = function (name) {
            var conditions = this.options.validateConditions;
            var rules = WIS_EMAP_INPUT.allValidateRules;
            var model = this.options.fieldModel;
            if (conditions.length) {
                if (name instanceof Array) {
                    name.map(function (item) {
                        required(item, conditions, model);
                    })
                } else {
                    required(name, conditions, model);
                }
            }
            function required(name, conditions, model) {
                if (conditions.filter(function (item) {
                        return item.type === 'required' && item.name === name;
                    }).length === 0) {
                    var caption = model.filter(function (item) {return item.name === name})[0].caption;
                    conditions.push({
                        name: name,
                        type: "required",
                        captions: caption,
                        rule: rules['required'].func,
                        alertText: rules['required'].alertText.replace('* ', caption)
                    })
                }
            }
        }

        /**
         * @method unRequireItem
         * @description 设置指定字段的必填校验
         * @param {String|Array} name - 字段的name，可以为数组
         */
        Plugin.prototype.unRequireItem = function (name) {
            var conditions = this.options.validateConditions;
            var rules = WIS_EMAP_INPUT.allValidateRules;
            var model = this.options.fieldModel;
            if (conditions.length) {
                if (name instanceof Array) {
                    name.map(function (item) {
                        unRequired(item, conditions, model);
                    })
                } else {
                    unRequired(name, conditions, model);
                } 
            }
            function unRequired(name, conditions, model) {
                var index;
                var conditionItem = conditions.filter(function (item, i) {
                    if (item.type === 'required' && item.name === name) {
                        index = i;
                        return true;
                    }
                });
                if (conditionItem.length) {
                    conditions.splice(index, 1);
                }
            }
        }

        /**
         * 
         */
        Plugin.prototype.hide = function () {
            return this.$element.bhValidate('hideValidate');
        }
        Plugin.prototype.hideHint = function (selector) {
            var name = selector.match(/\[data-name=[\"|\']?(\w+)[\"|\']?\]/);
            return this.$element.bhValidate('hideValidate', name);
        }

        return Plugin;
    })();


    //生成dom
    function _init(element, options) {
        if (!options.fieldModel) {
            return console && console.warn('校验组件fieldModel不能为空！');
        }
        // 为所有的文本框项添加失焦校验 
        options.fieldModel.map(function (item) {
            if (!item.xtype || item.xtype === 'text') {
                item.validateAction = 'blur';
            }
        });
        //qiyu 2016-12-14 调用时缺失最后的options参数
        options.validateConditions = initValidateCondition(options.fieldModel, element, options);
        // 对于模型中含有validateAction的字段，为自定义的事件触发校验
        options.fieldModel.map(function (item) {
            var itemElement = $('[data-name="' + item.name + '"]', element);
            if (item.validateAction) {
                item.validateAction.split(',').map(function (actionItem) {
                    itemElement.on(actionItem, function () {
                        $(this).trigger('_formChange');
                    })
                })
            }
        })

        element.on('_formChange', function (event) {
            var target = event.target;
            var name = $(target).data('name');
            validateAction(element, options, name);
        });
    }

    // 生成校验条件
    function initValidateCondition(fieldModel, element, options) {
        var rules = WIS_EMAP_INPUT.allValidateRules;
        var condition = [];
        if (fieldModel.length) {
            fieldModel.map(function (item) {
                condition = condition.concat(initItemValidateCondition(item, rules, element, options));
            });
        }
        return condition;
    }

    // 获取单个字段的校验条件
    function initItemValidateCondition(fieldItem, rules, element, options) {
        var itemConditions = [];
        // 必填校验
        var attr = WIS_EMAP_SERV.getAttr(fieldItem);
        if (attr.required) {
            itemConditions.push({
                name: fieldItem.name,
                type: "required",
                captions: fieldItem.caption,
                rule: rules['required'].func,
                alertText: rules['required'].alertText.replace('* ', fieldItem.caption)
            });
        }

        // double 类型的字段 自动添加 double 校验和  长度为21的校验
        if (fieldItem.dataType == 'double') {
            itemConditions.push({
                name: fieldItem.name,
                captions: fieldItem.caption,  
                type: "double",
                rule: function (value) {
                    if (value == undefined || value === '') return true;
                    return new RegExp(rules['double'].regex).test(value);
                },
                alertText: rules['double'].alertText.replace('* ', fieldItem.caption)
            });
        }

        // int 类型的字段 自动添加 数字校验
        if (fieldItem.dataType == 'int') {
            itemConditions.push({
                name: fieldItem.name,
                captions: fieldItem.caption,
                type: 'integer',
                rule: function (value) {
                    if (value === undefined || value === '') return true;
                    return rules['integer'].regex.test(value);
                },
                alertText: rules['integer'].alertText.replace('* ', fieldItem.caption)
            });
        }

        // 生成长度校验
        var maxSize = 0;
        if (fieldItem.checkSize) {
            // 设置了校验长度 则使用校验长度
            maxSize = fieldItem.checkSize;
        } else {
            // 开启简单长度校验模式,所有字符 都算三个长度
            if (fieldItem.dataType == 'String' && 
            (
                (fieldItem.xtype == 'textarea' && options.textareaEasyCheck)
                || options.easyCheck === true
            )
                ) {
                maxSize = fieldItem.dataSize ? Math.floor(fieldItem.dataSize / 3) : 0;
            } else {
                maxSize = fieldItem.dataSize ? fieldItem.dataSize : 0;
            }
        }

        if (maxSize > 0 && ($.inArray(fieldItem.xtype, ['date-local', 'date-full', 'date-ym', 'switcher']) === -1) ) {
            var itemRules = {
                name: fieldItem.name,
                captions: fieldItem.caption,
                type: 'size',
                rule: function (value) {
                    if (value === undefined || value === '') return true;
                    if (options.easyCheck === true) {
                        return value.length <= maxSize;
                    } else {
                        return _getValueLength(value) <= maxSize;
                    }
                },
                alertText: fieldItem.caption + '长度超出限制'
            };
            if (fieldItem.xtype == 'textarea') {
                itemRules.alertText = fieldItem.caption + '长度不能超过' + maxSize + '个字';
                itemRules.rule = function (value) {
                    if (options.textareaEasyCheck === true) {
                        return value.length <= maxSize;
                    } else {
                        return _getValueLength(value) <= maxSize;
                    }
                };
            }
            // // 文本框金额类的 小数  长度校验
            // if ((fieldItem.xtype == 'text' || !fieldItem.xtype)) {
            //     if (maxSize.toString().indexOf(',') > -1) {
            //         var lengthArr = maxSize.split(',');
            //         itemRules.rule = function (value) {
            //             if (value == '') return true;
            //             new RegExp('^\\d{1-' + valArr[0] + '}')
            //             var valArr = _this.val().toString().split('.');
            //             if (valArr.length > 1) {
            //                 if (valArr[1].length > lengthArr[1]) return false
            //             }

            //             return valArr[0].length <= lengthArr[0] - lengthArr[1];
            //         };

            //         rules.push({
            //             input: '[data-name=' + name + ']',
            //             message: '金额类型不正确',
            //             action: 'change, blur, valuechanged',
            //             rule: function () {
            //                 if (_this.val() == '') return true;
            //                 return _this.val().length < 22;
            //             }
            //         });
            //     } else {}

            // }
            itemConditions.push(itemRules);
        }

        // 正则校验
        var exp = fieldItem.checkExp;
        if (exp && exp != "undefined") {
            itemConditions.push({
                name: fieldItem.name,
                captions: fieldItem.caption,
                type: 'regexp',
                alertText: fieldItem.caption + '不正确',
                rule: function (value) {
                    if (value == "") {
                        return true;
                    } // 空值不做校验
                    return eval(exp).test(value);
                }
            });
        }

        // 类型校验
        var jsonType = fieldItem.JSONParam || '{}';
        var checkType = fieldItem.checkType;
        if (!checkType || checkType == 'undefined') checkType = jsonType;
        if (typeof checkType === 'string') { 
            checkType = checkType.replace(/\[|\]|\"|\{|\}|custom/g, ""); // 对原版校验组件custom[mail] 写法的兼容
        }
        if (checkType && typeof checkType === 'string') { 
            checkType.split(',').map(function (item) {
                getTypeValidate(item, fieldItem, itemConditions, rules, element);
            });
        }
        

        if ($.inArray(fieldItem.xtype, ['uploadfile']) > -1) {
            itemConditions.push({
                name: fieldItem.name,
                captions: fieldItem.caption,
                action: 'bh-file-upload-validate',
                alertText: ' ',
                rule: function (value, fieldElement) {
                    return fieldElement.find('.bh-error').length === 0;
                }
            });
        }

        // 上传1.2  如有出错的文件则不通过校验
        if ($.inArray(attr.xtype, ['cache-upload']) > -1) {
            itemConditions.push({
                name: attr.name,
                captions: attr.caption,
                action: 'bh.file.upload.done',
                alertText: '上传文件有误',
                rule: function (value, fieldElement) {
                    return fieldElement.find('.emap-upload-block-wrap.error').length === 0;
                }
            });
            $('[data-name=' + attr.name + ']', element).on('bh.file.upload.done bh.file.upload.delete', function () {
                $(this).trigger('_formChange');
            });
        }

        return itemConditions;
    }

    function getTypeValidate(checkType, fieldItem, itemConditions, rules, element) {
        var itemRules = {};
        if (rules[checkType]) {
            itemRules = {
                name: fieldItem.name,
                captions: fieldItem.caption,
                type: checkType,
                alertText: rules[checkType].alertText.replace('* ', fieldItem.caption),
            };
            if (rules[checkType].regex) {
                itemRules.rule = function (value) {
                    if (value == "") {
                        return true;
                    } // 空值不做校验
                    return new RegExp(rules[checkType].regex).test(value);
                };
            } else if (rules[checkType].func) {
                itemRules.rule = function (value) {
                    if (value == "") {
                        return true;
                    } // 空值不做校验
                    return rules[checkType].func(value);
                };
            }
            itemConditions.push(itemRules);
        } else if (checkType && checkType.indexOf('@') > -1) { // 字段联动校验  after@CSRQ
            var linkArray = checkType.split('@');
            var linkType = linkArray[0];
            var linkElement = $('[data-name=' + linkArray[1] + ']', element);
            itemRules = {
                name: fieldItem.name,
                captions: fieldItem.caption,
                type: checkType
            };
            itemRules.alertText = rules[linkType].alertText.replace('*1', fieldItem.caption).replace('*2', linkElement.data('caption'));
            itemRules.rule = function (value) {
                return rules[linkType].func(value, linkArray[1], element);
            };
            itemConditions.push(itemRules);
        } else if (checkType.indexOf('after') > -1 || checkType.indexOf('before') > -1) { // 兼容现有应用中after 和before 类型的联动
            var linkType = '';
            var linkElement;
            var checkField = '';
            if (/^before=/g.test(checkType)) {
                linkType = 'before=';
            } else if (/^before/g.test(checkType)) {
                linkType = 'before';
            } else if (/^after=/g.test(checkType)) {
                linkType = 'after=';
            } else if (/^after/g.test(checkType)) {
                linkType = 'after';
            } else if (/^validate\:\s?(\"|\')?after\w+(\"|\')?/g.test(checkType)) {
                linkType = 'after';
                checkType = checkType.replace(/(validate|\'|\:|\s)/g, '');
            } else if (/^validate\:\s?(\"|\')?before\w+(\"|\')?/g.test(checkType)) {
                linkType = 'before';
                checkType = checkType.replace(/(validate|\'|\:|\s)/g, '');
            } else if (/^validate\:\s?(\"|\')?after=\w+(\"|\')?/g.test(checkType)) {
                linkType = 'after=';
                checkType = checkType.replace(/(validate|\'|\:|\s)/g, '');
            } else if (/^validate\:\s?(\"|\')?before=\w+(\"|\')?/g.test(checkType)) {
                linkType = 'before=';
                checkType = checkType.replace(/(validate|\'|\:|\s)/g, '');
            }
            checkField = checkType.replace(linkType, '');
            linkElement = $('[data-name=' + checkField + ']', element);

            itemRules = {
                name: fieldItem.name,
                captions: fieldItem.caption,
                type: checkType
            };
            itemRules.alertText = rules[linkType].alertText.replace('*1', fieldItem.caption).replace('*2', checkField === 'now' ? '当前' : linkElement.data('caption'));
            itemRules.rule = function (value) {
                return rules[linkType].func(value, checkType.replace(linkType, ''), element);
            };
            itemConditions.push(itemRules);
        }
    }

    // 获取取值长度   中文为 3个字符
    function _getValueLength(val) {
        if (typeof val === 'number') {
            val = val + '';
        }
        return val.replace(/[\u0391-\uFFE5]/g, '***').length;
    }

    // 校验方法，那么为指定的字段名，如未指定name，则对表单内所有字段进行校验
    function validateAction(element, options, name, autoFocus) {
        autoFocus = autoFocus === undefined ? false : autoFocus;
        var result = true;
        if (name) {
            var fieldItem = $('[data-name="' + name + '"]', element); 
            result = validateItem(fieldItem, options, autoFocus);
        } else {
            $('[data-name][xtype]', element).each(function () {
                var item_result = validateItem($(this), options, autoFocus);
                if (result === true) {
                    result = item_result;
                }
            })
        }
        options.focusFlag = false;
        return result;
    }

    // 校验单个字段
    function validateItem(fieldElement, options, autoFocus) {
        autoFocus = autoFocus === undefined ? false : autoFocus;
        var result = true;
        var name = fieldElement.data('name');
        var index = 0;
        // 跳过隐藏字段 跳过disable 字段 跳过表格表单的只读字段和隐藏字段
        if (fieldElement.closest('.bh-row').attr('hidden') ||
            fieldElement.closest('.bh-form-group').css('display') === 'none' ||
            fieldElement.closest('.bh-form-group').hasClass('bh-disabled') ||
            fieldElement[0].nodeName == 'P' ||
            fieldElement.attr('xtype') == 'div') { 
            return result;
        }
        var value = WIS_EMAP_INPUT.getValue(fieldElement, {});
        var itemConditions = options.validateConditions.filter(function (item) {
            return item.name == name;
        });
        if (itemConditions.length) {
            for (var i = 0; i < itemConditions.length; i++) {
                result = itemConditions[i].rule(value, fieldElement);
                if (result === false) {
                    console && console.warn('校验未通过 - ' + name + ' : ' + value);
                    console && console.warn(itemConditions[i]);
                    index = i; 
                    break;
                }
            }
        }
        // change view
        if (result) {
            options.validateView.hideValidate(fieldElement);
        } else {
            options.validateView.showValidate(fieldElement, itemConditions[index].alertText);
            if (autoFocus && options.focusFlag !== true ) {
                var xtype = fieldElement.attr('xtype');
                // 解决日期控件focus无法触发页面定位的问题 
                if ($.inArray(xtype, ['date-local', 'date-full', 'date-ym', 'date-area', 'date-range']) > -1) {
                    $('input', fieldElement).focus().blur()
                } else {
                    fieldElement.focus();
                }
                options.focusFlag = true;
            } 
        }
        return result;
    }

    $.fn.bhValidate = function (options, params, params2) {
        var instance;
        instance = $(this).data('bhvalidate');
        if (!instance) {
            return this.each(function () {
                if (options == 'destroy') {
                    return this;
                }
                return $(this).data('bhvalidate', new Plugin(this, options));
            });
        }
        if (options === true) return instance;
        if ($.type(options) === 'string') return instance[options](params, params2);
        return this;
    };


    $.fn.bhValidate.view = {
        // 显示字段的校验信息
        showValidate: function (fieldElement, message) {
            var field_row = fieldElement.closest('.form-validate-block');
            var error_info = field_row.find('.jqx-validator-error-info');
            if (
                field_row.hasClass('jqx-validator-error-container')
                && error_info.length && error_info.data('message') == message
            ) return;
            fieldElement.addClass('jqx-validator-error-control');
            if (error_info.length > 0) {
                error_info.remove();
            }
            field_row.addClass('jqx-validator-error-container')
                .append('<div class="bh-form-group jqx-validator-error-info bh-pv-4 bh-col-md-6" style="display: block;" data-message="' + message + '">' + message + '</div>');
        },
        // 隐藏字段的校验信息, 若未传name，则隐藏所有的字段校验信息
        hideValidate: function (fieldElement) {
            fieldElement.removeClass('jqx-validator-error-control');
            var field_row = fieldElement.closest('.form-validate-block');
            field_row.removeClass('jqx-validator-error-container')
                .find('.jqx-validator-error-info').remove();
        }
    }

    /**
     * @memberof module:bhValidate
     * @prop {Array} fieldModel - 数据模型对象数组
     * @prop {Boolean} [textareaEasyCheck=false] - 计数文本域长度，默认为一个汉字算三个字符，为true时汉字和英文都算1个字符
     * @prop {Object} [validateView] - 自定义校验提示信息的处理方法，包含showValidate(显示提示信息)和hideValidate(隐藏提示信息)两个方法，
     * 格式为{showValidate: function (fieldElement, message) {}，hideValidate: function (fieldElement) {}}
     */
    $.fn.bhValidate.defaults = {
        fieldModel: null,
        easyCheck: false,
        textareaEasyCheck: false,
        validateView: $.fn.bhValidate.view
    };

}).call(undefined);