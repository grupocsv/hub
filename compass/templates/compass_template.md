---
title: Título Fiel à Fonte Primária
description: Síntese objetiva e verificável da edição.
layout: doc
sidebar: true
outline: false
prev: false
next: false
head:
  - - meta
    - property: og:title
      content: Título Fiel à Fonte Primária
  - - meta
    - property: og:description
      content: Síntese objetiva e verificável da edição.
  - - meta
    - property: og:type
      content: article
compass:
  number: NNN
  year: AAAA
  title: Título Fiel à Fonte Primária
  subtitle: null
  status: Minuta para revisão
  publishedAt: null
  pdf: /compass/edicoes/AAAA/NNN/compass_NNN_AAAA.pdf
  mode: flow
  product:
    name: Compass™
    owner: Grupo CSV
  editorial:
    responsible: MedValor®
  elaboration:
    - AxiaCare®
---

<script setup>
import CompassNNNContent from './CompassNNNContent.vue'
</script>

<CompassEdition :metadata="$frontmatter.compass">
  <CompassNNNContent />
</CompassEdition>

<style src="./edition.css"></style>
