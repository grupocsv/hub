<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'

const { frontmatter } = useData()
const metadata = computed(() => frontmatter.value.compass ?? {})
const title = computed(() => metadata.value.title ?? frontmatter.value.title ?? 'Compass™')
const subtitle = computed(() => metadata.value.subtitle ?? '')
const edition = computed(() => metadata.value.edition ?? metadata.value.number ?? '')
const year = computed(() => metadata.value.year ?? '')
const mode = computed(() => metadata.value.mode ?? 'flow')

const credits = Object.freeze({
  product: 'Compass™ — elaboração do Grupo CSV',
  editorialResponsibility: 'Responsabilidade editorial: MedValor®',
})
</script>

<template>
  <article class="compass-v2" :class="{ 'compass-v2--paged': mode === 'paged' }" itemscope itemtype="https://schema.org/Report">
    <header v-if="mode !== 'paged'" class="compass-cover">
      <div class="compass-cover__brand">
        <img
          class="compass-cover__logo compass-cover__logo--light"
          src="https://assets.grupocsv.com/logos/grupo-csv/horizontal-positivo-transparente.png"
          alt="Grupo CSV"
        >
        <img
          class="compass-cover__logo compass-cover__logo--dark"
          src="https://assets.grupocsv.com/logos/grupo-csv/horizontal-negativo-transparente.png"
          alt=""
          aria-hidden="true"
        >
      </div>

      <p class="compass-cover__eyebrow">Compass™ · Edição {{ edition }}/{{ year }}</p>
      <h1 itemprop="headline">{{ title }}</h1>
      <p v-if="subtitle" class="compass-cover__subtitle" itemprop="alternativeHeadline">{{ subtitle }}</p>

      <div class="compass-cover__meta" aria-label="Créditos editoriais">
        <span>{{ credits.product }}</span>
        <span>{{ credits.editorialResponsibility }}</span>
      </div>
    </header>

    <div class="compass-v2__content" itemprop="articleBody">
      <slot />
    </div>

    <footer v-if="mode !== 'paged'" class="compass-v2__footer">
      <strong>{{ credits.product }}</strong>
      <span>{{ credits.editorialResponsibility }}</span>
    </footer>
  </article>
</template>
