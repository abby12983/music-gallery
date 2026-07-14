// 未来音乐坊·各校教学风采共享 - 数据配置
// 24所项目学校（2026年6月更新）

const SCHOOLS_DATA = [
  // === 内蒙古·赤峰 ===
  {
    id: "songshan-anqing",
    name: "松山区安庆北道小学",
    region: "内蒙古·赤峰",
    teacher: "",
    gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    items: []
  },
  {
    id: "hanwula",
    name: "罕乌拉小学",
    region: "内蒙古·赤峰",
    teacher: "",
    gradient: "linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)",
    items: []
  },

  // === 内蒙古·锡林郭勒 ===
  {
    id: "shiyishi",
    name: "锡林浩特市第十一小学",
    region: "内蒙古·锡林郭勒",
    teacher: "",
    gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    items: []
  },

  // === 内蒙古·兴安盟 ===
  {
    id: "zhamuqin",
    name: "扎木钦中心校",
    region: "内蒙古·兴安盟",
    teacher: "",
    gradient: "linear-gradient(135deg, #7f5a83 0%, #0d324d 100%)",
    items: []
  },
  {
    id: "daiqintala",
    name: "代钦塔拉中心校",
    region: "内蒙古·兴安盟",
    teacher: "",
    gradient: "linear-gradient(135deg, #c471f5 0%, #fa71cd 100%)",
    items: []
  },
  {
    id: "keyouqianqi1",
    name: "科尔沁右翼前旗第一小学",
    region: "内蒙古·兴安盟",
    teacher: "",
    gradient: "linear-gradient(135deg, #48c6ef 0%, #6f86d6 100%)",
    items: []
  },
  {
    id: "manzutun",
    name: "科尔沁右翼前旗满族屯学校",
    region: "内蒙古·兴安盟",
    teacher: "",
    gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    items: []
  },
  {
    id: "aershanyi",
    name: "阿尔山市第一小学",
    region: "内蒙古·兴安盟",
    teacher: "",
    gradient: "linear-gradient(135deg, #0ba360 0%, #3cba92 100%)",
    items: []
  },

  // === 内蒙古·呼和浩特 ===
  {
    id: "shenglezhen",
    name: "盛乐镇小学",
    region: "内蒙古·呼和浩特",
    teacher: "",
    gradient: "linear-gradient(135deg, #f6d365 0%, #fda085 100%)",
    items: []
  },

  // === 云南·曲靖 ===
  {
    id: "yangdao",
    name: "陆良县马街镇漾稻小学",
    region: "云南·曲靖",
    teacher: "",
    gradient: "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
    items: []
  },
  {
    id: "zhenyuanpu",
    name: "陆良县马街镇贞元堡小学",
    region: "云南·曲靖",
    teacher: "",
    gradient: "linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)",
    items: []
  },

  // === 云南·昭通 ===
  {
    id: "huodehong",
    name: "火德红镇中心小学",
    region: "云南·昭通",
    teacher: "",
    gradient: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
    items: []
  },
  {
    id: "guangming",
    name: "鲁甸县龙头山镇光明小学",
    region: "云南·昭通",
    teacher: "",
    gradient: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
    items: []
  },

  // === 云南·普洱 ===
  {
    id: "mangjing",
    name: "芒景村小学",
    region: "云南·普洱",
    teacher: "",
    gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    items: []
  },

  // === 云南·文山 ===
  {
    id: "yanshan3",
    name: "砚山县第三小学",
    region: "云南·文山",
    teacher: "",
    gradient: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
    items: []
  },

  // === 四川·阿坝 ===
  {
    id: "bazhou",
    name: "汶川县灞州小学校",
    region: "四川·阿坝",
    teacher: "",
    gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    items: []
  },

  // === 广东·清远 ===
  {
    id: "liannan",
    name: "连南瑶族自治县民族小学",
    region: "广东·清远",
    teacher: "",
    gradient: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
    items: []
  },

  // === 广东·汕尾 ===
  {
    id: "chengbei",
    name: "陆河县河田镇城北小学",
    region: "广东·汕尾",
    teacher: "",
    gradient: "linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)",
    items: []
  },

  // === 广东·深汕 ===
  {
    id: "xiaomo",
    name: "深汕特别合作区小漠中心小学",
    region: "广东·深汕",
    teacher: "",
    gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    items: []
  },
  {
    id: "houmen",
    name: "鲘门中心小学",
    region: "广东·深汕",
    teacher: "",
    gradient: "linear-gradient(135deg, #fdcbf1 0%, #e6dee9 100%)",
    items: []
  },

  // === 西藏·林芝 ===
  {
    id: "chawalong",
    name: "察瓦龙乡中心小学",
    region: "西藏·林芝",
    teacher: "",
    gradient: "linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)",
    items: []
  },
  {
    id: "motuo",
    name: "墨脱县完全小学",
    region: "西藏·林芝",
    teacher: "",
    gradient: "linear-gradient(135deg, #96fbc4 0%, #f9f586 100%)",
    items: []
  },

  // === 新疆·喀什 ===
  {
    id: "kashi27",
    name: "喀什市二十七小学",
    region: "新疆·喀什",
    teacher: "",
    gradient: "linear-gradient(135deg, #fddb92 0%, #d1fdff 100%)",
    items: []
  },
  {
    id: "kashi47",
    name: "喀什市第四十七中学（小学部）",
    region: "新疆·喀什",
    teacher: "",
    gradient: "linear-gradient(135deg, #c1dfc4 0%, #deecdd 100%)",
    items: []
  }
];
