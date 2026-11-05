# Instructions pour les agents

## Autorisation Git permanente

- Exécuter sans demander confirmation les opérations `git pull`, `git fetch`, `git commit` et `git push` nécessaires au travail demandé, y compris via le plugin GitHub.
- Cette autorisation concerne les remotes déjà configurés.
- Ne jamais ajouter, supprimer, renommer ou modifier un remote Git, ni changer son URL de récupération ou de publication.
- Préserver les modifications locales de l’utilisateur et résoudre les situations ambiguës sans écraser son travail.

## Commits

- Commencer chaque message de commit par un verbe à l’infinitif.
- Faire un commit distinct par fonctionnalité, correction ou issue demandée.
- Pour une issue, inclure `Closes #<numéro>` dans le message.
- Pour chaque commit créé ou amendé avec la contribution de Codex, y compris via le plugin GitHub, terminer le message par le trailer officiel ci-dessous, présent une seule fois et séparé du corps par une ligne vide :

  ```text
  Co-authored-by: Codex <noreply@openai.com>
  ```
- Conserver les autres auteurs et trailers existants. Une simple mention « Contribution : Codex » ne remplace pas ce trailer.
