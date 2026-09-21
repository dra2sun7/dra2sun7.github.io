const { createApp, ref, computed, onMounted, nextTick } = Vue;

async function loadJson(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
  return res.json();
}

createApp({
  setup() {
    const profile = ref(null);
    const projects = ref([]);
    const loadError = ref('');

    const view = ref('cards');     // 'cards' | 'table'
    const category = ref('전체');
    const stack = ref('');          // 기술 태그 필터
    const selected = ref(null);     // 상세 보기 중인 프로젝트
    const dialogEl = ref(null);

    onMounted(async () => {
      try {
        const [p, list] = await Promise.all([loadJson('profile.json'), loadJson('projects.json')]);
        profile.value = p;
        projects.value = list;
        if (p.name) document.title = `${p.name} 포트폴리오`;
      } catch (err) {
        console.error(err);
        loadError.value =
          '데이터 파일을 불러오지 못했습니다. index.html을 더블클릭해서 열었다면 Live Server 같은 로컬 서버로 열어 주세요. ' +
          '서버에서 열었는데도 이 문구가 보이면 profile.json과 projects.json의 문법(쉼표, 따옴표)을 확인해 주세요.';
      }
    });

    const featured = computed(() => projects.value.filter(p => p.featured !== false));
    const others = computed(() => projects.value.filter(p => p.featured === false));

    const categories = computed(() => ['전체', ...new Set(featured.value.map(p => p.category))]);

    const visible = computed(() =>
      featured.value.filter(p =>
        (category.value === '전체' || p.category === category.value) &&
        (!stack.value || p.stack.includes(stack.value))
      )
    );

    function toggleStack(s) {
      stack.value = stack.value === s ? '' : s;
    }

    function resetFilters() {
      category.value = '전체';
      stack.value = '';
    }

    // 개선 전후 막대 길이: 둘 중 큰 값을 100%로 두고 비율로 계산
    function barWidth(m, which) {
      const max = Math.max(m.beforeValue, m.afterValue) || 1;
      const value = which === 'before' ? m.beforeValue : m.afterValue;
      return Math.max(1, (value / max) * 100) + '%';
    }

    function openDetail(p) {
      selected.value = p;
      nextTick(() => dialogEl.value.showModal());
    }

    function closeDetail() {
      dialogEl.value.close();
    }

    // 창 바깥(어두운 배경)을 누르면 닫기
    function onDialogClick(e) {
      if (e.target === dialogEl.value) closeDetail();
    }

    return {
      profile, projects, loadError,
      view, category, stack, selected, dialogEl,
      others, categories, visible,
      toggleStack, resetFilters, barWidth,
      openDetail, closeDetail, onDialogClick,
    };
  },
}).mount('#app');
