package com.qinfei.qferp.entity.crm;

import com.qinfei.core.annotation.Id;
import com.qinfei.core.annotation.Table;
import lombok.Data;

import java.io.Serializable;
import java.util.Date;

/**
 * 表：crm客户公司表(TCrmCompany)实体类
 *
 * @author jca
 * @since 2020-07-07 17:27:21
 */
@Data
@Table(name = "t_crm_company")
public class CrmCompany implements Serializable {
    /**
    * 公司主键
    */
    @Id
    private Integer id;
    /**
    * 公司名称
    */
    private String name;
    /**
    * 行业 FK
    */
    private String industry;
    /**
    * 产品
    */
    private String product;
    /**
    * 公司结构
    */
    private String structure;
    /**
    * 品牌
    */
    private String brand;
    /**
    * 传播目的
    */
    private String purpose;
    /**
    * 规模
    */
    private String scale;
    /**
    * 投放量
    */
    private String advVolume;
    /**
    * 地区
    */
    private String area;
    /**
    * 传播经验
    */
    private String experience;
    /**
    * 发布媒体
    */
    private String publicMedia;
    /**
    * 投放渠道
    */
    private String channel;
    /**
    * 创建时间
    */
    private Date createTime;
    
    private Integer creator;
    /**
    * 更新时间
    */
    private Date updateTime;
    
    private Integer updateUserId;
    /**
    * 客户公司代码
    */
    private String typeCode;
    /**
    * 客户公司名称
    */
    private String typeName;
    /**
    * 公司类型字段，0企业客户，1个人客户
    */
    private Integer type;
    /**
    * 标准化字段，1标准，0非标准
    */
    private Integer standardize;
    /**
    * 公司logo
    */
    private String image;
    /**
    * 删除标志位，1删除，0不删除
    */
    private Integer deleteFlag;
    /**
     * 保护等级,默认0不保护，1代表C,2代表B,3代表A
     */
    private Integer protectLevel;
    /**
    * 审核状态，1已审核，0未审核
    */
    private Integer auditFlag;

}