export const mockLinkedInUserInfoResponse = {
  sub: "2KIe48vP5c",
  name: "Test User",
  email: "test@example.com",
};

export const mockLinkedInMeResponse = {
  id: "2KIe48vP5c",
  firstName: {
    localized: { en_US: "Test" },
  },
  lastName: {
    localized: { en_US: "User" },
  },
};

export const mockLinkedInPostSuccess = {
  owner: "urn:li:person:2KIe48vP5c",
  activity: "urn:li:activity:7400775770177982464",
  edited: false,
  subject: "Posts on Home",
  created: {
    actor: "urn:li:person:2KIe48vP5c",
    time: 1764482443351,
  },
  lastModified: {
    actor: "urn:li:person:2KIe48vP5c",
    time: 1764482443351,
  },
  text: {
    text: "KVM + Libvirt Setup Guide (with Cloud-Init and Bridged Networking)",
  },
  id: "7400775769544912896",
  distribution: {
    linkedInDistributionTarget: {
      visibleToGuest: true,
    },
  },
  content: {
    title: "Posts on Home",
    contentEntities: [
      {
        entityLocation:
          "https://mrmcmuffinz.github.io/posts/kvm_libvirt_setup_guide/",
        thumbnails: [
          {
            imageSpecificContent: {},
            resolvedUrl: "https://mrmcmuffinz.github.io/images/social-card.png",
          },
        ],
        title: "Posts on Home",
        entity: "urn:li:article:-1",
      },
    ],
    shareMediaCategory: "ARTICLE",
  },
};

export const mockRssFeed = {
  title: "Posts on Home",
  link: "https://mrmcmuffinz.github.io/posts/",
  description: "Recent content in Posts on Home",
  items: [
    {
      title: "KVM + Libvirt Setup Guide",
      link: "https://mrmcmuffinz.github.io/posts/kvm_libvirt_setup_guide/",
      pubDate: "Sun, 01 Dec 2024 00:00:00 +0000",
      guid: "https://mrmcmuffinz.github.io/posts/kvm_libvirt_setup_guide/",
      content: "A comprehensive guide to setting up KVM with Libvirt",
      contentSnippet: "A comprehensive guide to setting up KVM with Libvirt",
    },
  ],
};

export const mockRssXml = `<?xml version="1.0" encoding="utf-8" standalone="yes"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Posts on Home</title>
    <link>https://mrmcmuffinz.github.io/posts/</link>
    <description>Recent content in Posts on Home</description>
    <generator>Hugo</generator>
    <language>en-us</language>
    <lastBuildDate>Sun, 01 Dec 2024 00:00:00 +0000</lastBuildDate>
    <atom:link href="https://mrmcmuffinz.github.io/posts/index.xml" rel="self" type="application/rss+xml" />
    <item>
      <title>KVM + Libvirt Setup Guide</title>
      <link>https://mrmcmuffinz.github.io/posts/kvm_libvirt_setup_guide/</link>
      <pubDate>Sun, 01 Dec 2024 00:00:00 +0000</pubDate>
      <guid>https://mrmcmuffinz.github.io/posts/kvm_libvirt_setup_guide/</guid>
      <description>A comprehensive guide to setting up KVM with Libvirt</description>
    </item>
  </channel>
</rss>`;
