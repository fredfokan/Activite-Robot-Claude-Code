# Ce que fait Claude — robot-activite

Un mod pour Claude Code qui ajoute à droite de la conversation un panneau **« Ce que fait Claude »**.

En haut, un petit robot orange animé, dessiné en formes vectorielles :

- il **dort** (yeux fermés, petits « z ») quand Claude ne fait rien ;
- il **lit avec une loupe** quand Claude lit un fichier ;
- il **écrit avec un crayon** quand Claude crée ou modifie un fichier ;
- il **cherche avec des jumelles** quand Claude fait une recherche ;
- il **saute de joie** quand Claude a terminé.

En dessous, la liste des actions en français simple, avec une icône et l'heure, par exemple
`📖 Je lis « devis.pdf »` ou `✏️ Je crée « recap.md »`.

Le mod **observe seulement** : il ne bloque aucune action, n'envoie rien sur le réseau et ne supprime rien.

## Installation

Dans une session Claude Code, à l'invite du terminal :

```
/plugin install robot-activite --marketplace fredfokan/Activite-Robot-Claude-Code
```

Réponds `y` pour ajouter le catalogue, puis choisis la portée (Entrée pour « utilisateur »).

Depuis un shell :

```
claude plugin install robot-activite --marketplace fredfokan/Activite-Robot-Claude-Code
```

Dans l'application de bureau : clique sur **+** à côté de la zone de saisie, puis **Plugins**, **Add marketplace** avec `fredfokan/Activite-Robot-Claude-Code`, puis **Add plugin**.

## Utilisation

Le panneau s'ouvre tout seul quand la fenêtre est assez large (environ 144 colonnes dans le terminal).
Sinon, tape `/ce-que-fait-claude` pour l'ouvrir.

Sur le bureau, dans VS Code et sur mobile, le robot est un SVG animé. Le terminal n'affichant pas le SVG,
le même dessin y est converti en pixels de couleur, animés quatre fois par seconde.

## Licence

MIT — © 2026 Frederic Fokan. Voir le fichier [LICENSE](LICENSE).
