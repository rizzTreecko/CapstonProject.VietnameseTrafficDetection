/**
 * signs.js – Vietnamese traffic sign reference data
 *
 * Each entry contains:
 *   id       – class index used by the YOLO model
 *   label    – English / model class name
 *   name     – Vietnamese display name
 *   category – one of: 'warning' | 'prohibition' | 'mandatory' | 'info'
 */

const TRAFFIC_SIGNS = [
  // ── Prohibition signs (Biển cấm) ──
  { id: 0,  label: 'no_entry',            name: 'Cấm đi vào',                     category: 'prohibition' },
  { id: 1,  label: 'no_left_turn',        name: 'Cấm rẽ trái',                    category: 'prohibition' },
  { id: 2,  label: 'no_right_turn',       name: 'Cấm rẽ phải',                    category: 'prohibition' },
  { id: 3,  label: 'no_u_turn',           name: 'Cấm quay đầu xe',                category: 'prohibition' },
  { id: 4,  label: 'no_overtaking',       name: 'Cấm vượt',                       category: 'prohibition' },
  { id: 5,  label: 'no_stopping',        name: 'Cấm dừng xe và đỗ xe',           category: 'prohibition' },
  { id: 6,  label: 'no_parking',          name: 'Cấm đỗ xe',                      category: 'prohibition' },
  { id: 7,  label: 'no_horn',             name: 'Cấm bóp còi',                    category: 'prohibition' },
  { id: 8,  label: 'speed_limit_10',      name: 'Hạn chế tốc độ 10 km/h',         category: 'prohibition' },
  { id: 9,  label: 'speed_limit_15',      name: 'Hạn chế tốc độ 15 km/h',         category: 'prohibition' },
  { id: 10, label: 'speed_limit_20',      name: 'Hạn chế tốc độ 20 km/h',         category: 'prohibition' },
  { id: 11, label: 'speed_limit_30',      name: 'Hạn chế tốc độ 30 km/h',         category: 'prohibition' },
  { id: 12, label: 'speed_limit_40',      name: 'Hạn chế tốc độ 40 km/h',         category: 'prohibition' },
  { id: 13, label: 'speed_limit_50',      name: 'Hạn chế tốc độ 50 km/h',         category: 'prohibition' },
  { id: 14, label: 'speed_limit_60',      name: 'Hạn chế tốc độ 60 km/h',         category: 'prohibition' },
  { id: 15, label: 'speed_limit_70',      name: 'Hạn chế tốc độ 70 km/h',         category: 'prohibition' },
  { id: 16, label: 'speed_limit_80',      name: 'Hạn chế tốc độ 80 km/h',         category: 'prohibition' },
  { id: 17, label: 'no_trucks',           name: 'Cấm xe tải',                     category: 'prohibition' },
  { id: 18, label: 'no_motorcycles',      name: 'Cấm xe mô tô',                   category: 'prohibition' },
  { id: 19, label: 'no_bicycles',         name: 'Cấm xe đạp',                     category: 'prohibition' },
  { id: 20, label: 'no_pedestrians',      name: 'Cấm người đi bộ',                category: 'prohibition' },

  // ── Warning signs (Biển cảnh báo) ──
  { id: 21, label: 'crossroad',           name: 'Giao nhau với đường không ưu tiên', category: 'warning' },
  { id: 22, label: 'roundabout',          name: 'Vòng xuyến',                     category: 'warning' },
  { id: 23, label: 'pedestrian_crossing', name: 'Người đi bộ cắt ngang',          category: 'warning' },
  { id: 24, label: 'children_crossing',   name: 'Trẻ em',                         category: 'warning' },
  { id: 25, label: 'road_narrows',        name: 'Đường hẹp',                      category: 'warning' },
  { id: 26, label: 'slippery_road',       name: 'Đường trơn',                     category: 'warning' },
  { id: 27, label: 'traffic_lights',      name: 'Đường có đèn tín hiệu',          category: 'warning' },
  { id: 28, label: 'steep_descent',       name: 'Dốc xuống nguy hiểm',            category: 'warning' },
  { id: 29, label: 'steep_ascent',        name: 'Dốc lên nguy hiểm',              category: 'warning' },
  { id: 30, label: 'bump',                name: 'Gờ giảm tốc',                    category: 'warning' },
  { id: 31, label: 'railroad_crossing',   name: 'Giao nhau với đường sắt',        category: 'warning' },

  // ── Mandatory signs (Biển hiệu lệnh) ──
  { id: 32, label: 'turn_left',           name: 'Hướng đi bắt buộc – rẽ trái',   category: 'mandatory' },
  { id: 33, label: 'turn_right',          name: 'Hướng đi bắt buộc – rẽ phải',   category: 'mandatory' },
  { id: 34, label: 'go_straight',         name: 'Đi thẳng',                       category: 'mandatory' },
  { id: 35, label: 'roundabout_mandatory',name: 'Vòng xuyến bắt buộc',            category: 'mandatory' },
  { id: 36, label: 'pass_left',           name: 'Vượt bên trái',                  category: 'mandatory' },
  { id: 37, label: 'pass_right',          name: 'Vượt bên phải',                  category: 'mandatory' },
  { id: 38, label: 'min_speed_40',        name: 'Tốc độ tối thiểu 40 km/h',       category: 'mandatory' },

  // ── Informational / priority signs (Biển chỉ dẫn) ──
  { id: 39, label: 'priority_road',       name: 'Đường ưu tiên',                  category: 'info' },
  { id: 40, label: 'yield',               name: 'Nhường đường',                   category: 'info' },
  { id: 41, label: 'stop',                name: 'Dừng lại',                       category: 'info' },
  { id: 42, label: 'one_way',             name: 'Đường một chiều',                category: 'info' },
  { id: 43, label: 'parking',             name: 'Nơi đỗ xe',                      category: 'info' },
  { id: 44, label: 'hospital',            name: 'Bệnh viện',                      category: 'info' },
  { id: 45, label: 'fuel_station',        name: 'Trạm xăng',                      category: 'info' },
  { id: 46, label: 'highway_begin',       name: 'Bắt đầu đường cao tốc',          category: 'info' },
  { id: 47, label: 'highway_end',         name: 'Hết đường cao tốc',              category: 'info' },
];

/** Look up a sign by class label or class id. Returns undefined if not found. */
function getSign(labelOrId) {
  if (typeof labelOrId === 'number') {
    return TRAFFIC_SIGNS.find(s => s.id === labelOrId);
  }
  return TRAFFIC_SIGNS.find(
    s => s.label === labelOrId || s.name === labelOrId
  );
}

/** Return the badge CSS class for a given category. */
function categoryBadgeClass(category) {
  const map = {
    warning:     'badge-warning',
    prohibition: 'badge-danger',
    mandatory:   'badge-info',
    info:        'badge-success',
  };
  return map[category] || 'badge-info';
}

/** Return the bounding-box stroke colour for a given category. */
function categoryColor(category) {
  const map = {
    warning:     '#e07000',
    prohibition: '#dc3545',
    mandatory:   '#457b9d',
    info:        '#198754',
  };
  return map[category] || '#457b9d';
}
